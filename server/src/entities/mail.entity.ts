import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { WeaponTemplate } from './weapon-template.entity';

export enum MailRewardType {
  GOLD = 'gold',
  WEAPON = 'weapon',
  STONES = 'stones',
  MULTIPLE = 'multiple',
}

@Entity('mails')
@Index('idx_user_active', ['userId', 'isDeleted', 'expiresAt'])
@Index('idx_user_unclaimed', ['userId', 'isClaimed', 'isDeleted'])
export class Mail {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  id: number;

  @Column({ type: 'bigint', name: 'user_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  userId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({
    type: 'enum',
    enum: MailRewardType,
    name: 'reward_type',
  })
  rewardType: MailRewardType;

  @Column({ type: 'int', nullable: true, name: 'reward_weapon_template_id' })
  rewardWeaponTemplateId: number;

  @Column({ type: 'int', default: 0, name: 'reward_gold' })
  rewardGold: number;

  @Column({ type: 'int', default: 0, name: 'reward_stones' })
  rewardStones: number;

  @Column({ type: 'boolean', default: false, name: 'is_claimed' })
  isClaimed: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.mails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WeaponTemplate, (template) => template.mails)
  @JoinColumn({ name: 'reward_weapon_template_id' })
  rewardWeaponTemplate: WeaponTemplate;
}
