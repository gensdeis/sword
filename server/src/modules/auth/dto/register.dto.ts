import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Username (3-50 characters, alphanumeric)',
    example: 'swordmaster123',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Username must contain only alphanumeric characters',
  })
  username: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
