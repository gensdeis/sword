import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { WeaponTemplate } from './weapon-template.entity';
import { BattleRecord } from './battle-record.entity';
import { SeasonRanking } from './season-ranking.entity';

export enum SeasonStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  SETTLING = 'settling',
  COMPLETED = 'completed',
}

@Entity('seasons')
@Index('idx_status', ['status'])
@Index('idx_dates', ['startAt', 'endAt'])
export class Season {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'int', unique: true, name: 'season_number' })
  seasonNumber: number;

  @Column({ type: 'timestamp', name: 'start_at' })
  startAt: Date;

  @Column({ type: 'timestamp', name: 'end_at' })
  endAt: Date;

  @Column({
    type: 'enum',
    enum: SeasonStatus,
    default: SeasonStatus.UPCOMING,
  })
  status: SeasonStatus;

  @Column({ type: 'int', nullable: true, name: 'reward_weapon_template_id' })
  rewardWeaponTemplateId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => WeaponTemplate, (template) => template.seasons)
  @JoinColumn({ name: 'reward_weapon_template_id' })
  rewardWeaponTemplate: WeaponTemplate;

  @OneToMany(() => BattleRecord, (battle) => battle.season)
  battleRecords: BattleRecord[];

  @OneToMany(() => SeasonRanking, (ranking) => ranking.season)
  rankings: SeasonRanking[];
}
