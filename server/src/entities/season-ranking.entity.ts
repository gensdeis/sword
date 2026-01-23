import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Season } from './season.entity';
import { User } from './user.entity';

@Entity('season_rankings')
@Index('idx_ranking', ['seasonId', 'totalPoints'])
export class SeasonRanking {
  @PrimaryColumn({ type: 'int', name: 'season_id' })
  seasonId: number;

  @PrimaryColumn({ type: 'bigint', name: 'user_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  userId: number;

  @Column({ type: 'int', default: 0, name: 'total_points' })
  totalPoints: number;

  @Column({ type: 'int', default: 0, name: 'win_count' })
  winCount: number;

  @Column({ type: 'int', default: 0, name: 'lose_count' })
  loseCount: number;

  @Column({ type: 'int', default: 0, name: 'current_streak' })
  currentStreak: number;

  @Column({ type: 'int', default: 0, name: 'best_streak' })
  bestStreak: number;

  @Column({ type: 'int', default: 0, name: 'max_enhancement_level' })
  maxEnhancementLevel: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  // Relations
  @ManyToOne(() => Season, (season) => season.rankings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @ManyToOne(() => User, (user) => user.rankings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
