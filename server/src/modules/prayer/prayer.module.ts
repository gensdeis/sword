import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrayerService } from './prayer.service';
import { PrayerController } from './prayer.controller';
import { PrayerHistory } from '@/entities/prayer-history.entity';
import { User } from '@/entities/user.entity';
import { RedisModule } from '@/modules/redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrayerHistory, User]), RedisModule],
  providers: [PrayerService],
  controllers: [PrayerController],
  exports: [PrayerService],
})
export class PrayerModule {}
