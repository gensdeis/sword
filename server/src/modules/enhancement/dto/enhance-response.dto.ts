import { ApiProperty } from '@nestjs/swagger';

export class EnhanceResponseDto {
  @ApiProperty({
    description: 'Enhancement result',
    enum: ['success', 'maintain', 'destroyed'],
    example: 'success',
  })
  result: 'success' | 'maintain' | 'destroyed';

  @ApiProperty({
    description: 'New enhancement level (null if destroyed)',
    example: 5,
    nullable: true,
  })
  newLevel: number | null;

  @ApiProperty({
    description: 'Level increase amount (0 for maintain, 1 or 2 for success, -level for destroyed)',
    example: 1,
  })
  levelIncrease: number;

  @ApiProperty({
    description: 'Updated weapon object',
    type: 'object',
    nullable: true,
  })
  weapon: any;

  @ApiProperty({
    description: 'Success rate that was used',
    example: 45.5,
  })
  successRate: number;

  @ApiProperty({
    description: 'Destruction rate that was used',
    example: 15.5,
  })
  destructionRate: number;

  @ApiProperty({
    description: 'Prayer effect that was applied',
    enum: ['positive', 'negative', 'neutral', 'none'],
    example: 'positive',
  })
  prayerEffect: 'positive' | 'negative' | 'neutral' | 'none';

  @ApiProperty({ description: 'Number of positive buffs applied', example: 5 })
  positiveBuffs: number;

  @ApiProperty({ description: 'Number of negative buffs applied', example: 2 })
  negativeBuffs: number;
}
