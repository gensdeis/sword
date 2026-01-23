import { Weapon } from '.';

export interface EnhanceResponseDto {
  result: 'success' | 'maintain' | 'destroyed';
  newLevel: number | null;
  levelIncrease: number;
  weapon: Weapon | null;
  successRate: number;
  destructionRate: number;
  prayerEffect: 'positive' | 'negative' | 'neutral' | 'none';
  positiveBuffs: number;
  negativeBuffs: number;
}
