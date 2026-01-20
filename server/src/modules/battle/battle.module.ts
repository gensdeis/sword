import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleRecord } from '../../entities/battle-record.entity';
import { User } from '../../entities/user.entity';
import { BattleService } from './battle.service';
import { BattleController } from './battle.controller';
import { WeaponsModule } from '../weapons/weapons.module';
import { SeasonModule } from '../season/season.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BattleRecord, User]),
    WeaponsModule,
    SeasonModule,
  ],
  controllers: [BattleController],
  providers: [BattleService],
  exports: [BattleService],
})
export class BattleModule {}
