import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // For Supabase, the secret is your JWT Secret
      // We read from env or use a placeholder if not set yet (user must set it!)
      secretOrKey: process.env.SUPABASE_JWT_SECRET || 'your-supabase-jwt-secret-here',
    });
  }

  async validate(payload: any) {
    // payload contains Supabase JWT claims (e.g., sub which is the user id)
    return { sub: payload.sub, email: payload.email };
  }
}
