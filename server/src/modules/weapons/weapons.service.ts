import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { UserWeapon, WeaponTemplate, User } from '@/entities';
import { GAME_CONFIG, calculateSellPrice } from '@/config/game-balance.config';
import { WeaponResponseDto } from './dto/weapon-response.dto';
import { SellResponseDto } from './dto/sell-response.dto';

@Injectable()
export class WeaponsService implements OnModuleInit {
  constructor(
    @InjectRepository(UserWeapon)
    private userWeaponRepository: Repository<UserWeapon>,
    @InjectRepository(WeaponTemplate)
    private weaponTemplateRepository: Repository<WeaponTemplate>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.weaponTemplateRepository.count();
    // If we have only the 17 initial templates from init.sql, or 0, we import the CSV
    // (Initial templates have baseWeaponId as null)
    const newTemplatesCount = await this.weaponTemplateRepository.count({
      where: { baseWeaponId: MoreThanOrEqual(1) as any },
    });

    if (newTemplatesCount === 0) {
      await this.seedWeaponsFromCsv();
    }
  }

  async seedWeaponsFromCsv() {
    console.log('? Seeding weapons from CSV...');
    try {
      const csvPath = path.join(process.cwd(), 'server', 'data', 'weapons.csv');
      if (!fs.existsSync(csvPath)) {
        console.warn('?? Weapons CSV file not found at:', csvPath);
        return;
      }

      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.split('\n');
      const templates: WeaponTemplate[] = [];

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser for quoted strings
        const parts = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current);

        if (parts.length < 12) continue;

        const [
          id,
          base_weapon_id,
          name,
          level,
          rarity,
          base_attack,
          can_double_enhance,
          double_enhance_rate,
          sell_price_base,
          sell_price_per_level,
          description,
          is_hidden,
        ] = parts;

        const template = this.weaponTemplateRepository.create({
          id: parseInt(id),
          baseWeaponId: parseInt(base_weapon_id),
          name: name,
          level: parseInt(level),
          rarity: rarity as any,
          baseAttack: parseInt(base_attack),
          canDoubleEnhance: can_double_enhance === '1',
          doubleEnhanceRate: parseFloat(double_enhance_rate),
          sellPriceBase: parseInt(sell_price_base),
          sellPricePerLevel: parseInt(sell_price_per_level),
          description: description,
          isHidden: is_hidden === '1',
        });
        templates.push(template);
      }

      // Clear existing templates with baseWeaponId if any
      // await this.weaponTemplateRepository.delete({ baseWeaponId: Not(IsNull()) });
      
      // Save in chunks to avoid issues with large inserts
      const chunkSize = 500;
      for (let i = 0; i < templates.length; i += chunkSize) {
        await this.weaponTemplateRepository.save(templates.slice(i, i + chunkSize));
      }
      
      console.log(`? Successfully seeded ${templates.length} weapon templates`);
    } catch (error) {
      console.error('? Failed to seed weapons from CSV:', error);
    }
  }

  /**
   * Get user's non-destroyed weapons
   */
  async getMyWeapons(userId: number): Promise<WeaponResponseDto[]> {
    const weapons = await this.userWeaponRepository.find({
      where: {
        userId,
        isDestroyed: false,
      },
      relations: ['weaponTemplate'],
      order: {
        isEquipped: 'DESC',
        acquiredAt: 'DESC',
      },
    });

    return weapons.map((weapon) => this.mapToResponseDto(weapon));
  }

  /**
   * Get specific weapon by ID
   */
  async getWeaponById(
    weaponId: number,
    userId: number,
  ): Promise<WeaponResponseDto> {
    const weapon = await this.userWeaponRepository.findOne({
      where: { id: weaponId, userId },
      relations: ['weaponTemplate'],
    });

    if (!weapon) {
      throw new NotFoundException('Weapon not found');
    }

    if (weapon.isDestroyed) {
      throw new BadRequestException('This weapon has been destroyed');
    }

    return this.mapToResponseDto(weapon);
  }

  /**
   * Equip a weapon (unequip current first)
   */
  async equipWeapon(weaponId: number, userId: number): Promise<WeaponResponseDto> {
    const weapon = await this.userWeaponRepository.findOne({
      where: { id: weaponId, userId },
      relations: ['weaponTemplate'],
    });

    if (!weapon) {
      throw new NotFoundException('Weapon not found');
    }

    if (weapon.isDestroyed) {
      throw new BadRequestException('Cannot equip a destroyed weapon');
    }

    if (weapon.isEquipped) {
      throw new BadRequestException('This weapon is already equipped');
    }

    // Unequip currently equipped weapon
    await this.userWeaponRepository.update(
      { userId, isEquipped: true },
      { isEquipped: false },
    );

    // Equip the new weapon
    weapon.isEquipped = true;
    await this.userWeaponRepository.save(weapon);

    return this.mapToResponseDto(weapon);
  }

  /**
   * Get user's equipped weapon
   */
  async getEquippedWeapon(userId: number): Promise<UserWeapon> {
    const weapon = await this.userWeaponRepository.findOne({
      where: { userId, isEquipped: true, isDestroyed: false },
      relations: ['weaponTemplate'],
    });

    if (!weapon) {
      throw new NotFoundException(
        'No weapon equipped. Please equip a weapon before starting a battle.',
      );
    }
    return weapon;
  }

  /**
   * Sell weapon (soft delete and give stones)
   */
  async sellWeapon(
    weaponId: number,
    userId: number,
  ): Promise<SellResponseDto> {
    const weapon = await this.userWeaponRepository.findOne({
      where: { id: weaponId, userId },
      relations: ['weaponTemplate'],
    });

    if (!weapon) {
      throw new NotFoundException('Weapon not found');
    }

    if (weapon.isDestroyed) {
      throw new BadRequestException('This weapon has already been destroyed');
    }

    if (weapon.isEquipped) {
      throw new BadRequestException('Cannot sell an equipped weapon. Please unequip it first');
    }

    // Calculate sell price
    const stonesEarned = 
      weapon.weaponTemplate.sellPriceBase + 
      weapon.weaponTemplate.sellPricePerLevel * weapon.enhancementLevel;

    // Soft delete the weapon
    weapon.isDestroyed = true;
    weapon.destroyedAt = new Date();
    await this.userWeaponRepository.save(weapon);

    // Add stones to user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.enhancementStones += stonesEarned;
    await this.userRepository.save(user);

    return {
      stonesEarned,
      totalStones: user.enhancementStones,
      message: `Successfully sold ${weapon.weaponTemplate.name} for ${stonesEarned} enhancement stones`,
    };
  }

  /**
   * Create a new user weapon
   */
  async createUserWeapon(
    userId: number,
    templateId: number,
    isEquipped: boolean = false,
  ): Promise<UserWeapon> {
    const template = await this.weaponTemplateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Weapon template not found');
    }

    // Check weapon slots limit
    const weaponCount = await this.userWeaponRepository.count({
      where: { userId, isDestroyed: false },
    });

    if (weaponCount >= GAME_CONFIG.WEAPON.MAX_SLOTS) {
      throw new BadRequestException(
        `Weapon inventory full. Maximum ${GAME_CONFIG.WEAPON.MAX_SLOTS} weapons allowed`,
      );
    }

    // If this should be equipped, unequip current weapon
    if (isEquipped) {
      await this.userWeaponRepository.update(
        { userId, isEquipped: true },
        { isEquipped: false },
      );
    }

    const weapon = this.userWeaponRepository.create({
      weaponTemplateId: templateId,
      enhancementLevel: 0,
      isEquipped,
      isDestroyed: false,
    });
    weapon.userId = userId;

    return await this.userWeaponRepository.save(weapon);
  }

  /**
   * Get all weapon templates
   */
  async getWeaponTemplates(): Promise<WeaponTemplate[]> {
    return await this.weaponTemplateRepository.find({
      order: {
        rarity: 'ASC',
        baseAttack: 'ASC',
      },
    });
  }

  /**
   * Get specific weapon template by ID
   */
  async getWeaponTemplateById(id: number): Promise<WeaponTemplate> {
    const template = await this.weaponTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Weapon template not found');
    }

    return template;
  }

  /**
   * Map UserWeapon to WeaponResponseDto
   */
  public mapToResponseDto(weapon: UserWeapon): WeaponResponseDto {
    const template = weapon.weaponTemplate;
    const currentAttack = template.baseAttack + weapon.enhancementLevel * 10;

    return {
      id: weapon.id,
      userId: weapon.userId, // Access userId through the user relation
      weaponTemplateId: weapon.weaponTemplateId,
      enhancementLevel: weapon.enhancementLevel,
      isEquipped: weapon.isEquipped,
      isDestroyed: weapon.isDestroyed,
      acquiredAt: weapon.acquiredAt,
      weaponName: template.name,
      rarity: template.rarity,
      baseAttack: template.baseAttack,
      currentAttack,
      canDoubleEnhance: template.canDoubleEnhance,
      doubleEnhanceRate: Number(template.doubleEnhanceRate),
      description: template.description || '',
      imageUrl: template.imageUrl,
    };
  }
}
