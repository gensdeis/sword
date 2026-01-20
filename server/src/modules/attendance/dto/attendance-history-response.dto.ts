import { ApiProperty } from '@nestjs/swagger';

export class AttendanceHistoryItemDto {
  @ApiProperty({ description: 'Check date', example: '2024-01-15' })
  checkDate: Date;

  @ApiProperty({ description: 'Reward gold amount', example: 200 })
  rewardGold: number;

  @ApiProperty({
    description: 'Check-in timestamp',
    example: '2024-01-15T08:30:00.000Z',
  })
  checkedAt: Date;
}

export class AttendanceHistoryResponseDto {
  @ApiProperty({ description: 'Total attendance records count', example: 30 })
  total: number;

  @ApiProperty({ description: 'Current consecutive days', example: 5 })
  consecutiveDays: number;

  @ApiProperty({
    description: 'List of attendance records',
    type: [AttendanceHistoryItemDto],
  })
  records: AttendanceHistoryItemDto[];
}
