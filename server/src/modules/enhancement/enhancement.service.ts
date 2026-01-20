import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { UserWeapon } from '@/entities/user-weapon.entity';
import { User } from '@/entities/user.entity';
import { EnhancementHistory, EnhancementResult, PrayerEffect } from '@/entities/enhancement-history.entity';
import { WeaponTemplate } from '@/entities/weapon-template.entity';
import { PrayerService } from '@/modules/prayer/prayer.service';
import { GAME_CONFIG, getEnhancementRates } from '@/config/game-balance.config';

interface EnhancementRates {
  success: number;
  maintain: number;
  destruction: number;
}

@Injectable()
export class EnhancementService {
  constructor(
    @InjectRepository(UserWeapon)
    private userWeaponRepository: Repository<UserWeapon>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(EnhancementHistory)
    private enhancementHistoryRepository: Repository<EnhancementHistory>,
    private prayerService: PrayerService,
  ) {}

  /**
   * Main enhancement logic
   * Enhances a weapon with prayer effect from global pool
   */
  async enhanceWeapon(
    userId: number,
    weaponId: number,
  ): Promise<{
    result: EnhancementResult;
    newLevel: number | null;
    levelIncrease: number;
    weapon: UserWeapon | null;
    successRate: number;
    destructionRate: number;
    prayerEffect: PrayerEffect;
  }> {
    // Get weapon with relations
    const weapon = await this.userWeaponRepository.findOne({
      where: { id: weaponId, userId },
      relations: ['weaponTemplate'],
    });

    if (!weapon) {
      throw new NotFoundException('Weapon not found');
    }

    if (weapon.isDestroyed) {
      throw new BadRequestException('Cannot enhance destroyed weapon');
    }

    if (weapon.enhancementLevel >= GAME_CONFIG.WEAPON.MAX_ENHANCEMENT_LEVEL) {
      throw new BadRequestException('Weapon is already at max level');
    }

    // Get user for seed
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Consume prayer effect from global pool
    const prayerEffect = await this.prayerService.consumePrayerEffect();

    // Calculate enhancement rates with prayer effect
    const rates = this.calculateEnhancementRates(weapon.enhancementLevel, prayerEffect);

    // Perform enhancement with seeded random
    const result = await this.performEnhancement(weapon, rates, user);

    // Check for double enhancement (legendary weapons only)
    let levelIncrease = 0;
    let newLevel: number | null = weapon.enhancementLevel;

    if (result === EnhancementResult.SUCCESS) {
      levelIncrease = 1;

      // Check for double jump
      const isDoubleJump = this.checkDoubleEnhancement(weapon);
      if (isDoubleJump && weapon.enhancementLevel + 2 <= GAME_CONFIG.WEAPON.MAX_ENHANCEMENT_LEVEL) {
        levelIncrease = 2;
      }

      newLevel = weapon.enhancementLevel + levelIncrease;
      weapon.enhancementLevel = newLevel;
      await this.userWeaponRepository.save(weapon);
    } else if (result === EnhancementResult.MAINTAIN) {
      levelIncrease = 0;
      newLevel = weapon.enhancementLevel;
    } else if (result === EnhancementResult.DESTROYED) {
      levelIncrease = -weapon.enhancementLevel;
      newLevel = null;
      weapon.isDestroyed = true;
      weapon.destroyedAt = new Date();

      // Unequip if equipped
      if (weapon.isEquipped) {
        weapon.isEquipped = false;
      }

      await this.userWeaponRepository.save(weapon);
    }

    // Record enhancement history
    await this.recordEnhancementHistory(
      weapon.id,
      userId,
      result,
      rates,
      prayerEffect,
      weapon.enhancementLevel - levelIncrease, // from level
      newLevel, // to level
    );

    return {
      result,
      newLevel,
      levelIncrease,
      weapon: result !== EnhancementResult.DESTROYED ? weapon : null,
      successRate: rates.success,
      destructionRate: rates.destruction,
      prayerEffect: prayerEffect === 'none' ? PrayerEffect.NONE : prayerEffect === 'positive' ? PrayerEffect.POSITIVE : prayerEffect === 'negative' ? PrayerEffect.NEGATIVE : PrayerEffect.NEUTRAL,
    };
  }

  /**
   * Calculate enhancement rates with prayer effect applied
   */
  private calculateEnhancementRates(
    level: number,
    prayerEffect: 'positive' | 'negative' | 'neutral' | 'none',
  ): EnhancementRates {
    // Get base rates
    const baseRates = getEnhancementRates(level);
    let { success, maintain, destruction } = baseRates;

    // Apply prayer effects
    if (prayerEffect === 'positive') {
      // +5%p success rate
      success += GAME_CONFIG.PRAYER.EFFECTS.SUCCESS_BONUS;
    } else if (prayerEffect === 'negative') {
      // +3%p destruction rate
      destruction += GAME_CONFIG.PRAYER.EFFECTS.DESTRUCTION_PENALTY;
    }
    // neutral and none have no effect

    // Apply min/max constraints
    success = Math.max(
      GAME_CONFIG.ENHANCEMENT.MIN_SUCCESS_RATE,
      Math.min(GAME_CONFIG.ENHANCEMENT.MAX_SUCCESS_RATE, success),
    );
    destruction = Math.max(
      GAME_CONFIG.ENHANCEMENT.MIN_DESTRUCTION_RATE,
      Math.min(GAME_CONFIG.ENHANCEMENT.MAX_DESTRUCTION_RATE, destruction),
    );

    // Adjust maintain to keep total = 100%
    maintain = 100 - success - destruction;

    // Ensure maintain is never negative
    if (maintain < 0) {
      // If maintain goes negative, reduce destruction proportionally
      const overflow = -maintain;
      destruction = Math.max(GAME_CONFIG.ENHANCEMENT.MIN_DESTRUCTION_RATE, destruction - overflow);
      maintain = 100 - success - destruction;
    }

    return { success, maintain, destruction };
  }

  /**
   * Perform enhancement with seeded random
   */
  private async performEnhancement(
    weapon: UserWeapon,
    rates: EnhancementRates,
    user: User,
  ): Promise<EnhancementResult> {
    // Generate deterministic random seed
    const seed = this.generateRandomSeed(user.seedSalt, weapon.id);
    const random = this.seededRandom(seed);

    // Roll enhancement result
    const roll = random * 100;

    if (roll < rates.success) {
      return EnhancementResult.SUCCESS;
    } else if (roll < rates.success + rates.maintain) {
      return EnhancementResult.MAINTAIN;
    } else {
      return EnhancementResult.DESTROYED;
    }
  }

  /**
   * Generate deterministic seed from user salt, timestamp, and weapon ID
   */
  private generateRandomSeed(userSeedSalt: string, weaponId: number): number {
    const timestamp = Date.now();
    const seedString = `${userSeedSalt}-${timestamp}-${weaponId}`;

    // Create hash and convert to number
    const hash = createHash('sha256').update(seedString).digest('hex');

    // Take first 8 characters and convert to number
    const seed = parseInt(hash.substring(0, 8), 16);

    return seed;
  }

  /**
   * Seeded random number generator
   * Returns a number between 0 and 1
   */
  private seededRandom(seed: number): number {
    // Simple LCG (Linear Congruential Generator)
    // Using parameters from Numerical Recipes
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);

    const next = (a * seed + c) % m;
    return next / m;
  }

  /**
   * Check if weapon gets double enhancement (legendary only)
   * 15% chance for +2 levels instead of +1
   */
  private checkDoubleEnhancement(weapon: UserWeapon): boolean {
    const rarity = weapon.weaponTemplate.rarity;

    if (!GAME_CONFIG.ENHANCEMENT.DOUBLE_JUMP.ELIGIBLE_RARITIES.includes(rarity)) {
      return false;
    }

    // Generate another random for double jump check
    const roll = Math.random() * 100;
    return roll < GAME_CONFIG.ENHANCEMENT.DOUBLE_JUMP.RATE;
  }

  /**
   * Record enhancement attempt in history
   */
  private async recordEnhancementHistory(
    weaponId: number,
    userId: number,
    result: EnhancementResult,
    rates: EnhancementRates,
    prayerEffect: 'positive' | 'negative' | 'neutral' | 'none',
    fromLevel: number,
    toLevel: number | null,
  ): Promise<void> {
    const history = this.enhancementHistoryRepository.create({
      userWeaponId: weaponId,
      userId,
      fromLevel,
      toLevel,
      result,
      successRate: rates.success,
      destructionRate: rates.destruction,
      prayerEffect: prayerEffect === 'none' ? PrayerEffect.NONE : prayerEffect === 'positive' ? PrayerEffect.POSITIVE : prayerEffect === 'negative' ? PrayerEffect.NEGATIVE : PrayerEffect.NEUTRAL,
    });

    await this.enhancementHistoryRepository.save(history);
  }

  /**
   * Get user's enhancement history
   */
  async getEnhancementHistory(
    userId: number,
    limit: number = 50,
  ): Promise<{
    history: EnhancementHistory[];
    total: number;
  }> {
    const [history, total] = await this.enhancementHistoryRepository.findAndCount({
      where: { userId },
      order: { enhancedAt: 'DESC' },
      take: limit,
      relations: ['userWeapon', 'userWeapon.weaponTemplate'],
    });

    return { history, total };
  }
}
