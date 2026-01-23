import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserWeapon } from './user-weapon.entity';
import { BattleRecord } from './battle-record.entity';
import { SeasonRanking } from './season-ranking.entity';
import { Mail } from './mail.entity';
import { AttendanceRecord } from './attendance-record.entity';
import { GachaHistory } from './gacha-history.entity';
import { PrayerHistory } from './prayer-history.entity';
import { EnhancementHistory } from './enhancement-history.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'bigint', default: 1000 })
  gold: number;

  @Column({ type: 'int', default: 0, name: 'enhancement_stones' })
  enhancementStones: number;

  @Column({ type: 'varchar', length: 64, name: 'seed_salt' })
  seedSalt: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => UserWeapon, (weapon) => weapon.user)
  weapons: UserWeapon[];

  @OneToMany(() => BattleRecord, (battle) => battle.winner)
  battlesWon: BattleRecord[];

  @OneToMany(() => BattleRecord, (battle) => battle.loser)
  battlesLost: BattleRecord[];

  @OneToMany(() => SeasonRanking, (ranking) => ranking.user)
  rankings: SeasonRanking[];

  @OneToMany(() => Mail, (mail) => mail.user)
  mails: Mail[];

  @OneToMany(() => AttendanceRecord, (attendance) => attendance.user)
  attendanceRecords: AttendanceRecord[];

  @OneToMany(() => GachaHistory, (gacha) => gacha.user)
  gachaHistories: GachaHistory[];

  @OneToMany(() => PrayerHistory, (prayer) => prayer.user)
  prayerHistories: PrayerHistory[];

  @OneToMany(() => EnhancementHistory, (history) => history.user)
  enhancementHistories: EnhancementHistory[];
}
