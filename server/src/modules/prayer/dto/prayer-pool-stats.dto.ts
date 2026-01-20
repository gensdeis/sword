import { ApiProperty } from '@nestjs/swagger';

export class PrayerPoolStatsDto {
  @ApiProperty({
    description: 'Number of positive buffs in pool',
    example: 15,
  })
  positiveBuffs: number;

  @ApiProperty({
    description: 'Number of negative buffs in pool',
    example: 12,
  })
  negativeBuffs: number;

  @ApiProperty({
    description: 'Number of neutral effects in pool',
    example: 20,
  })
  neutrals: number;

  @ApiProperty({
    description: 'Total number of effects in pool',
    example: 47,
  })
  total: number;
}
