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

@Entity('gacha_history')
@Index('idx_user', ['userId'])
@Index('idx_pull_date', ['pulledAt'])
export class GachaHistory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  userId: number;

  @Column({ type: 'int', name: 'weapon_template_id' })
  weaponTemplateId: number;

  @Column({ type: 'int', name: 'cost_gold' })
  costGold: number;

  @Column({ type: 'int', default: 0, name: 'reroll_count' })
  rerollCount: number;

  @Column({ type: 'boolean', default: false, name: 'was_kept' })
  wasKept: boolean;

  @CreateDateColumn({ name: 'pulled_at' })
  pulledAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WeaponTemplate, (template) => template.gachaHistories)
  @JoinColumn({ name: 'weapon_template_id' })
  weaponTemplate: WeaponTemplate;
}
