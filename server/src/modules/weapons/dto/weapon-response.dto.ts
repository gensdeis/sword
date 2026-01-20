import { ApiProperty } from '@nestjs/swagger';
import { WeaponRarity } from '@/entities';

export class WeaponResponseDto {
  @ApiProperty({ description: 'User weapon ID' })
  id: number;

  @ApiProperty({ description: 'User ID' })
  userId: number;

  @ApiProperty({ description: 'Weapon template ID' })
  weaponTemplateId: number;

  @ApiProperty({ description: 'Enhancement level' })
  enhancementLevel: number;

  @ApiProperty({ description: 'Is equipped' })
  isEquipped: boolean;

  @ApiProperty({ description: 'Is destroyed' })
  isDestroyed: boolean;

  @ApiProperty({ description: 'Acquired date' })
  acquiredAt: Date;

  @ApiProperty({ description: 'Weapon template name' })
  weaponName: string;

  @ApiProperty({ enum: WeaponRarity, description: 'Weapon rarity' })
  rarity: WeaponRarity;

  @ApiProperty({ description: 'Base attack from template' })
  baseAttack: number;

  @ApiProperty({ description: 'Current total attack power' })
  currentAttack: number;

  @ApiProperty({ description: 'Can double enhance' })
  canDoubleEnhance: boolean;

  @ApiProperty({ description: 'Double enhance rate' })
  doubleEnhanceRate: number;

  @ApiProperty({ description: 'Weapon description' })
  description: string;

  @ApiProperty({ description: 'Weapon image URL', required: false })
  imageUrl?: string;
}
