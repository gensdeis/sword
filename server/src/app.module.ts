import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WeaponsModule } from './modules/weapons/weapons.module';
import { EnhancementModule } from './modules/enhancement/enhancement.module';
import { GachaModule } from './modules/gacha/gacha.module';
import { BattleModule } from './modules/battle/battle.module';
import { PrayerModule } from './modules/prayer/prayer.module';
import { SeasonModule } from './modules/season/season.module';
import { MailModule } from './modules/mail/mail.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Set to false in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    WeaponsModule,
    EnhancementModule,
    GachaModule,
    BattleModule,
    PrayerModule,
    SeasonModule,
    MailModule,
    AttendanceModule,
  ],
})
export class AppModule {}
