import { ApiProperty } from '@nestjs/swagger';

export class EnhancementHistoryItemDto {
  @ApiProperty({
    description: 'History record ID',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Weapon ID',
    example: 456,
  })
  userWeaponId: number;

  @ApiProperty({
    description: 'Enhancement level before attempt',
    example: 4,
  })
  fromLevel: number;

  @ApiProperty({
    description: 'Enhancement level after attempt (null if destroyed)',
    example: 5,
    nullable: true,
  })
  toLevel: number | null;

  @ApiProperty({
    description: 'Enhancement result',
    enum: ['success', 'maintain', 'destroyed'],
    example: 'success',
  })
  result: string;

  @ApiProperty({
    description: 'Success rate used',
    example: 45.5,
  })
  successRate: number;

  @ApiProperty({
    description: 'Destruction rate used',
    example: 15.5,
  })
  destructionRate: number;

  @ApiProperty({
    description: 'Prayer effect applied',
    enum: ['positive', 'negative', 'neutral', 'none'],
    example: 'positive',
  })
  prayerEffect: string;

  @ApiProperty({
    description: 'Timestamp of enhancement',
    example: '2024-01-15T12:34:56.789Z',
  })
  enhancedAt: Date;
}

export class EnhancementHistoryResponseDto {
  @ApiProperty({
    description: 'List of enhancement history records',
    type: [EnhancementHistoryItemDto],
  })
  history: EnhancementHistoryItemDto[];

  @ApiProperty({
    description: 'Total number of records',
    example: 42,
  })
  total: number;
}
