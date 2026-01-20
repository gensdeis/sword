import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Username', example: 'swordmaster123' })
  @Expose()
  username: string;

  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Gold amount', example: 1000 })
  @Expose()
  gold: number;

  @ApiProperty({
    description: 'Enhancement stones amount',
    example: 0,
  })
  @Expose()
  enhancementStones: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
