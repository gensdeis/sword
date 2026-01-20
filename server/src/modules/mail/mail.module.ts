import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Mail, User, UserWeapon, WeaponTemplate } from '@/entities';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { WeaponsModule } from '../weapons/weapons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mail, User, UserWeapon, WeaponTemplate]),
    ScheduleModule.forRoot(),
    WeaponsModule,
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
