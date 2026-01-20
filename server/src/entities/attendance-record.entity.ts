import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('attendance_records')
@Index('idx_user_date', ['userId', 'checkDate'])
export class AttendanceRecord {
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId: number;

  @PrimaryColumn({ type: 'date', name: 'check_date' })
  checkDate: Date;

  @Column({ type: 'int', name: 'reward_gold' })
  rewardGold: number;

  @CreateDateColumn({ name: 'checked_at' })
  checkedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.attendanceRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
