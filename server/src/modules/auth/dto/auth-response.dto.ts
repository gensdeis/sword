import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  constructor(access_token: string, user: UserResponseDto) {
    this.access_token = access_token;
    this.user = user;
  }
}
