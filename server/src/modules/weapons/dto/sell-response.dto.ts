import { ApiProperty } from '@nestjs/swagger';

export class SellResponseDto {
  @ApiProperty({ description: 'Enhancement stones earned from selling' })
  stonesEarned: number;

  @ApiProperty({ description: 'Total enhancement stones after selling' })
  totalStones: number;

  @ApiProperty({ description: 'Success message' })
  message: string;
}
