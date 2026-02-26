import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserPayload } from '../interfaces/user-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: Record<string, unknown>): Promise<UserPayload> {
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as 'bank' | 'mart' | 'admin',
      martId: (payload.martId as string) || null,
    };
  }
}
