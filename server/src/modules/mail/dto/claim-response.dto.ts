import { ApiProperty } from '@nestjs/swagger';

export class ClaimResponseDto {
  @ApiProperty({ description: 'Gold received', example: 0 })
  goldReceived: number;

  @ApiProperty({ description: 'Stones received', example: 0 })
  stonesReceived: number;

  @ApiProperty({
    description: 'Weapon ID received (if weapon reward)',
    example: 123,
    nullable: true,
  })
  weaponReceived: number | null;

  @ApiProperty({ description: 'Success message', example: 'Mail claimed successfully' })
  message: string;
}
