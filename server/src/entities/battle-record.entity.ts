import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Season } from './season.entity';
import { User } from './user.entity';
import { UserWeapon } from './user-weapon.entity';

@Entity('battle_records')
@Index('idx_season_user', ['seasonId', 'winnerId'])
@Index('idx_season_loser', ['seasonId', 'loserId'])
@Index('idx_battle_date', ['battleAt'])
export class BattleRecord {
  @PrimaryGeneratedColumn({ type: 'bigint', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  id: number;

  @Column({ type: 'int', name: 'season_id' })
  seasonId: number;

  @Column({ type: 'bigint', name: 'winner_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  winnerId: number;

  @Column({ type: 'bigint', name: 'loser_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  loserId: number;

  @Column({ type: 'bigint', name: 'winner_weapon_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  winnerWeaponId: number;

  @Column({ type: 'bigint', name: 'loser_weapon_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  loserWeaponId: number;

  @Column({ type: 'int', name: 'winner_weapon_level' })
  winnerWeaponLevel: number;

  @Column({ type: 'int', name: 'loser_weapon_level' })
  loserWeaponLevel: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'win_rate' })
  winRate: number;

  @Column({ type: 'int', name: 'winner_points_earned' })
  winnerPointsEarned: number;

  @Column({ type: 'int', name: 'winner_gold_earned' })
  winnerGoldEarned: number;

  @Column({ type: 'int', name: 'loser_gold_earned' })
  loserGoldEarned: number;

  @Column({ type: 'int', default: 1, name: 'winner_streak' })
  winnerStreak: number;

  @CreateDateColumn({ name: 'battle_at' })
  battleAt: Date;

  // Relations
  @ManyToOne(() => Season, (season) => season.battleRecords)
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @ManyToOne(() => User, (user) => user.battlesWon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'winner_id' })
  winner: User;

  @ManyToOne(() => User, (user) => user.battlesLost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loser_id' })
  loser: User;

  @ManyToOne(() => UserWeapon, (weapon) => weapon.battlesAsWinner)
  @JoinColumn({ name: 'winner_weapon_id' })
  winnerWeapon: UserWeapon;

  @ManyToOne(() => UserWeapon, (weapon) => weapon.battlesAsLoser)
  @JoinColumn({ name: 'loser_weapon_id' })
  loserWeapon: UserWeapon;
}
