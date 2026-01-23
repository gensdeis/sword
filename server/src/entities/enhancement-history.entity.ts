import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserWeapon } from './user-weapon.entity';
import { User } from './user.entity';

export enum EnhancementResult {
  SUCCESS = 'success',
  MAINTAIN = 'maintain',
  DESTROYED = 'destroyed',
}

export enum PrayerEffect {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  NONE = 'none',
}

@Entity('enhancement_history')
@Index('idx_user', ['userId'])
@Index('idx_weapon', ['userWeaponId'])
export class EnhancementHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  id: number;

  @Column({ type: 'bigint', name: 'user_weapon_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  userWeaponId: number;

  @Column({ type: 'bigint', name: 'user_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  userId: number;

  @Column({ type: 'int', name: 'from_level' })
  fromLevel: number;

  @Column({ type: 'int', nullable: true, name: 'to_level' })
  toLevel: number;

  @Column({
    type: 'enum',
    enum: EnhancementResult,
  })
  result: EnhancementResult;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'success_rate' })
  successRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'destruction_rate' })
  destructionRate: number;

  @Column({
    type: 'enum',
    enum: PrayerEffect,
    default: PrayerEffect.NONE,
    name: 'prayer_effect',
  })
  prayerEffect: PrayerEffect;

  @CreateDateColumn({ name: 'enhanced_at' })
  enhancedAt: Date;

  // Relations
  @ManyToOne(() => UserWeapon, (weapon) => weapon.enhancementHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_weapon_id' })
  userWeapon: UserWeapon;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
