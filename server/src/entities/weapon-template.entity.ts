import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserWeapon } from './user-weapon.entity';
import { Mail } from './mail.entity';
import { Season } from './season.entity';
import { GachaHistory } from './gacha-history.entity';

export enum WeaponRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('weapon_templates')
export class WeaponTemplate {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: WeaponRarity,
  })
  rarity: WeaponRarity;

  @Column({ type: 'int', name: 'base_attack' })
  baseAttack: number;

  @Column({ type: 'boolean', default: false, name: 'can_double_enhance' })
  canDoubleEnhance: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00, name: 'double_enhance_rate' })
  doubleEnhanceRate: number;

  @Column({ type: 'int', name: 'sell_price_base' })
  sellPriceBase: number;

  @Column({ type: 'int', name: 'sell_price_per_level' })
  sellPricePerLevel: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'image_url' })
  imageUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => UserWeapon, (userWeapon) => userWeapon.weaponTemplate)
  userWeapons: UserWeapon[];

  @OneToMany(() => Mail, (mail) => mail.rewardWeaponTemplate)
  mails: Mail[];

  @OneToMany(() => Season, (season) => season.rewardWeaponTemplate)
  seasons: Season[];

  @OneToMany(() => GachaHistory, (gacha) => gacha.weaponTemplate)
  gachaHistories: GachaHistory[];
}
