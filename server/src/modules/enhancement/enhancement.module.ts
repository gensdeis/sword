import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnhancementService } from './enhancement.service';
import { EnhancementController } from './enhancement.controller';
import { UserWeapon } from '@/entities/user-weapon.entity';
import { User } from '@/entities/user.entity';
import { EnhancementHistory } from '@/entities/enhancement-history.entity';
import { WeaponsModule } from '@/modules/weapons/weapons.module';
import { PrayerModule } from '@/modules/prayer/prayer.module';
import { SeasonModule } from '@/modules/season/season.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserWeapon, User, EnhancementHistory]),
    WeaponsModule,
    PrayerModule,
    SeasonModule,
  ],
  providers: [EnhancementService],
  controllers: [EnhancementController],
  exports: [EnhancementService],
})
export class EnhancementModule {}
