import { ApiProperty } from '@nestjs/swagger';

export class PrayerResponseDto {
  @ApiProperty({
    description: 'Message shown to user',
    example: '기도를 올렸습니다...',
  })
  message: string;

  @ApiProperty({
    description: 'Current size of global prayer pool',
    example: 42,
  })
  globalPoolSize: number;
}
