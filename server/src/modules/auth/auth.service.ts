import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Create user (password hashing is done in UsersService)
    const user = await this.usersService.create(registerDto);

    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // Return response with token and user info
    const userResponse = new UserResponseDto({
      id: user.id,
      username: user.username,
      email: user.email,
      gold: user.gold,
      enhancementStones: user.enhancementStones,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    return new AuthResponseDto(accessToken, userResponse);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // Return response with token and user info
    const userResponse = new UserResponseDto({
      id: user.id,
      username: user.username,
      email: user.email,
      gold: user.gold,
      enhancementStones: user.enhancementStones,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    return new AuthResponseDto(accessToken, userResponse);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
