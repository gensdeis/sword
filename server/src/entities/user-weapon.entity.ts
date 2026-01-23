import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { WeaponTemplate } from './weapon-template.entity';
import { EnhancementHistory } from './enhancement-history.entity';
import { BattleRecord } from './battle-record.entity';

@Entity('user_weapons')
@Index('idx_user_active', ['userId', 'isDestroyed'])
@Index('idx_user_equipped', ['userId', 'isEquipped'])
export class UserWeapon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id', transformer: {
    to: (value: number) => value,
    from: (value: string) => parseInt(value, 10),
  } })
  userId: number;

  @Column({ type: 'int', name: 'weapon_template_id' })
  weaponTemplateId: number;

  @Column({ type: 'int', default: 0, name: 'enhancement_level' })
  enhancementLevel: number;

  @Column({ type: 'boolean', default: false, name: 'is_equipped' })
  isEquipped: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_destroyed' })
  isDestroyed: boolean;

  @CreateDateColumn({ name: 'acquired_at' })
  acquiredAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'destroyed_at' })
  destroyedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.weapons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => WeaponTemplate, (template) => template.userWeapons)
  @JoinColumn({ name: 'weapon_template_id' })
  weaponTemplate: WeaponTemplate;

  @OneToMany(() => EnhancementHistory, (history) => history.userWeapon)
  enhancementHistories: EnhancementHistory[];

  @OneToMany(() => BattleRecord, (battle) => battle.winnerWeapon)
  battlesAsWinner: BattleRecord[];

  @OneToMany(() => BattleRecord, (battle) => battle.loserWeapon)
  battlesAsLoser: BattleRecord[];
}
