import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Lifetime of an access token. Kept short because there is no revocation list
 * yet: a stolen token stays usable until it expires. Moving to a 15 minute
 * access token plus a refresh token is the next step once the mobile client
 * supports it.
 */
export const JWT_EXPIRES_IN = '7d';

export const JWT_ALGORITHM = 'HS256';

/**
 * Cost factor shared by every bcrypt call. AuthService relies on it to make
 * the unknown-user path as slow as the known-user path, so it must stay the
 * single source of truth.
 */
export const BCRYPT_ROUNDS = 10;

/** Login attempts allowed per account and client address, per window. */
export const LOGIN_THROTTLE = { limit: 5, ttl: 15 * 60_000 };

/**
 * Login attempts allowed per client address across all accounts, per
 * window: high enough for many people behind one NAT, low enough to stop
 * one machine from trying passwords on account after account.
 */
export const LOGIN_IP_THROTTLE = { limit: 50, ttl: 15 * 60_000 };

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Reads JWT_SECRET and refuses to boot without it. A short secret only warns
 * so an existing deployment keeps starting; the value itself is never logged.
 */
export function readJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');

  if (!secret) throw new Error('JWT_SECRET is not set');
  if (secret.length < MIN_JWT_SECRET_LENGTH)
    new Logger('Auth').warn(
      `JWT_SECRET is shorter than ${MIN_JWT_SECRET_LENGTH} characters, generate a new one with: openssl rand -hex 64`,
    );
  return secret;
}
