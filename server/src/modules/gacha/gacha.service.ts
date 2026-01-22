import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  WeaponTemplate,
  GachaHistory,
  WeaponRarity,
  UserWeapon,
} from '@/entities';
import { GAME_CONFIG, getRerollCost } from '@/config/game-balance.config';
import { RedisService } from '../redis/redis.service';
import { WeaponsService } from '../weapons/weapons.service';
import { PullResponseDto } from './dto/pull-response.dto';
import { RerollResponseDto } from './dto/reroll-response.dto';
import { KeepResponseDto } from './dto/keep-response.dto';

export interface GachaSession {
  sessionId: string;
  userId: number;
  weaponTemplateId: number;
  rerollCount: number;
  totalGoldSpent: number;
  createdAt: number;
}

@Injectable()
export class GachaService {
  private readonly GACHA_SESSION_PREFIX = 'gacha:session:';
  private readonly GACHA_SESSION_TTL = 600; // 10 minutes

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WeaponTemplate)
    private weaponTemplateRepository: Repository<WeaponTemplate>,
    @InjectRepository(GachaHistory)
    private gachaHistoryRepository: Repository<GachaHistory>,
    @InjectRepository(UserWeapon)
    private userWeaponRepository: Repository<UserWeapon>,
    private redisService: RedisService,
    private weaponsService: WeaponsService,
  ) {}

  async getGachaSessionDetails(session: GachaSession) {
    const weapon = await this.weaponsService.getWeaponTemplateById(
      session.weaponTemplateId,
    );
    const rerollCost = this.calculateRerollCost(session.rerollCount);
    return {
      sessionId: session.sessionId,
      weapon,
      rerollCount: session.rerollCount,
      rerollCost,
      canReroll: rerollCost !== null,
    };
  }

  /**
   * Pull a weapon (costs 1000 gold)
   */
  async pullWeapon(userId: number): Promise<PullResponseDto> {
    // Check if user has an active session
    const existingSession = await this.getCurrentPullSession(userId);
    if (existingSession) {
      throw new BadRequestException(
        'You have an active gacha session. Please keep or reroll the current weapon first.',
      );
    }

    // Check if user has enough gold
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pullCost = GAME_CONFIG.GACHA.FIRST_PULL_COST;
    if (user.gold < pullCost) {
      throw new BadRequestException(
        `Insufficient gold. Required: ${pullCost}, Available: ${user.gold}`,
      );
    }

    // Deduct gold
    user.gold -= pullCost;
    await this.userRepository.save(user);

    // Select random weapon by rarity
    const weapon = await this.selectRandomWeaponByRarity();

    // Create gacha session
    const sessionId = uuidv4();
    const session: GachaSession = {
      sessionId,
      userId,
      weaponTemplateId: weapon.id,
      rerollCount: 0,
      totalGoldSpent: pullCost,
      createdAt: Date.now(),
    };

    await this.saveGachaSession(userId, session);

    const rerollCost = this.calculateRerollCost(0);

    return {
      sessionId,
      weapon,
      canReroll: rerollCost !== null,
      rerollCost,
      rerollCount: 0,
      costGold: pullCost,
    };
  }

  /**
   * Reroll current gacha pull
   */
  async rerollWeapon(userId: number, sessionId: string): Promise<RerollResponseDto> {
    const session = await this.getCurrentPullSession(userId);

    if (!session) {
      throw new BadRequestException('No active gacha session found');
    }

    if (session.sessionId !== sessionId) {
      throw new BadRequestException('Invalid session ID');
    }

    if (session.rerollCount >= GAME_CONFIG.GACHA.MAX_REROLL_COUNT) {
      throw new BadRequestException(
        `Maximum reroll limit (${GAME_CONFIG.GACHA.MAX_REROLL_COUNT}) reached`,
      );
    }

    // Calculate reroll cost
    const rerollCost = this.calculateRerollCost(session.rerollCount);
    if (rerollCost === null) {
      throw new BadRequestException('Cannot reroll anymore');
    }

    // Check if user has enough gold
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.gold < rerollCost) {
      throw new BadRequestException(
        `Insufficient gold for reroll. Required: ${rerollCost}, Available: ${user.gold}`,
      );
    }

    // Deduct gold
    user.gold -= rerollCost;
    await this.userRepository.save(user);

    // Select new random weapon
    const weapon = await this.selectRandomWeaponByRarity();

    // Update session
    session.weaponTemplateId = weapon.id;
    session.rerollCount += 1;
    session.totalGoldSpent += rerollCost;

    await this.saveGachaSession(userId, session);

    const nextRerollCost = this.calculateRerollCost(session.rerollCount);

    return {
      sessionId: session.sessionId,
      weapon,
      canReroll: nextRerollCost !== null,
      rerollCost: nextRerollCost,
      rerollCount: session.rerollCount,
      goldSpent: rerollCost,
    };
  }

  /**
   * Keep the current weapon and add to inventory
   */
  async keepWeapon(userId: number, sessionId: string): Promise<KeepResponseDto> {
    const session = await this.getCurrentPullSession(userId);

    if (!session) {
      throw new BadRequestException('No active gacha session found');
    }

    if (session.sessionId !== sessionId) {
      throw new BadRequestException('Invalid session ID');
    }

    // Get the weapon template
    const weaponTemplate = await this.weaponsService.getWeaponTemplateById(
      session.weaponTemplateId,
    );

    // Check if this is the user's first weapon (auto-equip)
    const existingWeaponCount = await this.userWeaponRepository.count({
      where: { userId, isDestroyed: false },
    });

    const isFirstWeapon = existingWeaponCount === 0;

    // Create the user weapon
    const userWeapon = await this.weaponsService.createUserWeapon(
      userId,
      session.weaponTemplateId,
      isFirstWeapon, // Auto-equip if first weapon
    );

    // Record gacha history
    const gachaHistory = this.gachaHistoryRepository.create({
      userId,
      weaponTemplateId: session.weaponTemplateId,
      costGold: session.totalGoldSpent,
      rerollCount: session.rerollCount,
      wasKept: true,
    });
    await this.gachaHistoryRepository.save(gachaHistory);

    // Delete the session
    await this.deleteGachaSession(userId);

    // Get the weapon with full details
    const weaponResponse = await this.weaponsService.getWeaponById(
      userWeapon.id,
      userId,
    );

    return {
      userWeapon: weaponResponse,
      wasAutoEquipped: isFirstWeapon,
      message: isFirstWeapon
        ? `Congratulations! You obtained ${weaponTemplate.name} (${weaponTemplate.rarity}) and it has been equipped!`
        : `Successfully obtained ${weaponTemplate.name} (${weaponTemplate.rarity})`,
    };
  }

  /**
   * Get current gacha pull session
   */
  async getCurrentPullSession(userId: number): Promise<GachaSession | null> {
    const key = `${this.GACHA_SESSION_PREFIX}${userId}`;
    const sessionData = await this.redisService.get(key);

    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData) as GachaSession;
  }

  /**
   * Calculate reroll cost based on reroll count
   */
  calculateRerollCost(rerollCount: number): number | null {
    return getRerollCost(rerollCount);
  }

  /**
   * Select random weapon by rarity using weighted random selection
   */
  async selectRandomWeaponByRarity(): Promise<WeaponTemplate> {
    // Get all weapon templates
    const allWeapons = await this.weaponTemplateRepository.find();

    if (allWeapons.length === 0) {
      throw new BadRequestException('No weapon templates available');
    }

    // First, determine rarity using gacha rates
    const selectedRarity = this.selectRarityByRate();

    // Filter weapons by selected rarity
    const weaponsOfRarity = allWeapons.filter(
      (w) => w.rarity === selectedRarity,
    );

    if (weaponsOfRarity.length === 0) {
      // Fallback to common if no weapons of selected rarity exist
      const commonWeapons = allWeapons.filter((w) => w.rarity === WeaponRarity.COMMON);
      if (commonWeapons.length === 0) {
        // Ultimate fallback - just return any weapon
        return allWeapons[Math.floor(Math.random() * allWeapons.length)];
      }
      return commonWeapons[Math.floor(Math.random() * commonWeapons.length)];
    }

    // Randomly select one weapon from the rarity pool
    return weaponsOfRarity[Math.floor(Math.random() * weaponsOfRarity.length)];
  }

  /**
   * Select rarity based on gacha rates
   */
  private selectRarityByRate(): WeaponRarity {
    const rates = GAME_CONFIG.GACHA.RATES;
    const random = Math.random() * 100;

    let cumulative = 0;
    for (const [rarity, rate] of Object.entries(rates)) {
      cumulative += rate;
      if (random < cumulative) {
        return rarity as WeaponRarity;
      }
    }

    // Fallback to common
    return WeaponRarity.COMMON;
  }

  /**
   * Save gacha session to Redis
   */
  private async saveGachaSession(
    userId: number,
    session: GachaSession,
  ): Promise<void> {
    const key = `${this.GACHA_SESSION_PREFIX}${userId}`;
    await this.redisService.set(
      key,
      JSON.stringify(session),
      this.GACHA_SESSION_TTL,
    );
  }

  /**
   * Delete gacha session from Redis
   */
  private async deleteGachaSession(userId: number): Promise<void> {
    const key = `${this.GACHA_SESSION_PREFIX}${userId}`;
    await this.redisService.del(key);
  }
}
