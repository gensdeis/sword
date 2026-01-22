import { Weapon } from '.';

export interface EnhanceResponseDto {
  result: 'SUCCESS' | 'FAILURE' | 'DESTROYED';
  newLevel: number;
  levelIncrease: number;
  weapon: Weapon;
  successRate: number;
  destructionRate: number;
  prayerEffect: number;
}
