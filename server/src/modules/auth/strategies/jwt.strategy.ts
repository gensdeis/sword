import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@/modules/users/users.service';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    console.log('--- JWT Strategy: Validating payload ---', payload);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      console.log('--- JWT Strategy: User not found ---');
      throw new UnauthorizedException('User not found');
    }

    console.log('--- JWT Strategy: User found, returning user object for request ---');
    return { userId: payload.sub, email: payload.email };
  }
}
