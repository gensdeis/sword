import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Season } from '../../entities/season.entity';
import { SeasonRanking } from '../../entities/season-ranking.entity';
import { SeasonService } from './season.service';
import { SeasonController } from './season.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Season, SeasonRanking]),
    MailModule,
  ],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}
