import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GachaService } from './gacha.service';
import { GachaController } from './gacha.controller';
import { User, WeaponTemplate, GachaHistory, UserWeapon } from '@/entities';
import { WeaponsModule } from '../weapons/weapons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, WeaponTemplate, GachaHistory, UserWeapon]),
    WeaponsModule,
  ],
  controllers: [GachaController],
  providers: [GachaService],
  exports: [GachaService],
})
export class GachaModule {}
