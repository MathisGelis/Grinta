import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from './auth-user.interface';
import { JWT_ALGORITHM, readJwtSecret } from './auth.constants';
import { PasswordStateService } from './password-state.service';

export interface JwtPayload {
  sub: string;
  email: string;
  /** Issue date, seconds since the epoch, set by jsonwebtoken. */
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly passwordState: PasswordStateService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: readJwtSecret(config),
      algorithms: [JWT_ALGORITHM],
    });
  }

  /**
   * Beyond the signature and the expiry, checked by passport-jwt: the
   * account must still exist and the token must not predate the last
   * password change or reset, which logs out the other sessions.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!(await this.passwordState.isTokenCurrent(payload.sub, payload.iat)))
      throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email };
  }
}
