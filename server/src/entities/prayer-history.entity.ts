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

export enum PrayerResult {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

@Entity('prayer_history')
@Index('idx_user', ['userId'])
@Index('idx_pray_date', ['prayedAt'])
export class PrayerHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  id: number;

  @Column({ type: 'bigint', name: 'user_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  userId: number;

  @Column({
    type: 'enum',
    enum: PrayerResult,
  })
  result: PrayerResult;

  @Column({ type: 'boolean', default: false, name: 'was_consumed' })
  wasConsumed: boolean;

  @CreateDateColumn({ name: 'prayed_at' })
  prayedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'consumed_at' })
  consumedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
