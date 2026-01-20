import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeaponsService } from './weapons.service';
import { WeaponsController } from './weapons.controller';
import { UserWeapon, WeaponTemplate, User } from '@/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserWeapon, WeaponTemplate, User]),
  ],
  controllers: [WeaponsController],
  providers: [WeaponsService],
  exports: [WeaponsService],
})
export class WeaponsModule {}
