import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWeapon, WeaponTemplate, User } from '@/entities';
import { GAME_CONFIG, calculateSellPrice } from '@/config/game-balance.config';
import { WeaponResponseDto } from './dto/weapon-response.dto';
import { SellResponseDto } from './dto/sell-response.dto';

@Injectable()
export class WeaponsService {
  constructor(
    @InjectRepository(UserWeapon)
    private userWeaponRepository: Repository<UserWeapon>,
    @InjectRepository(WeaponTemplate)
    private weaponTemplateRepository: Repository<WeaponTemplate>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

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
    const stonesEarned = calculateSellPrice(
      weapon.weaponTemplate.rarity,
      weapon.enhancementLevel,
    );

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
      userId,
      weaponTemplateId: templateId,
      enhancementLevel: 0,
      isEquipped,
      isDestroyed: false,
    });

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
  private mapToResponseDto(weapon: UserWeapon): WeaponResponseDto {
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
