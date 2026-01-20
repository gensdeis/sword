import { ApiProperty } from '@nestjs/swagger';

export class AttendanceResponseDto {
  @ApiProperty({ description: 'Gold earned from attendance', example: 200 })
  gold: number;

  @ApiProperty({ description: 'Consecutive days count', example: 5 })
  consecutiveDays: number;

  @ApiProperty({
    description: 'Check-in timestamp',
    example: '2024-01-15T08:30:00.000Z',
  })
  checkedAt: Date;

  @ApiProperty({
    description: 'Success message',
    example: '출석 완료! 200 골드를 받았습니다. (연속 5일)',
  })
  message: string;
}
