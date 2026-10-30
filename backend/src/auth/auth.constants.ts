import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AttemptLimitOptions } from '../common/throttling/attempt-limit';

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

/** Login: per account and address, then per address. */
export const LOGIN_ATTEMPTS: AttemptLimitOptions = {
  scope: 'login',
  account: { bodyField: 'identifier' },
  perAccount: LOGIN_THROTTLE,
  perAddress: LOGIN_IP_THROTTLE,
  code: 'TOO_MANY_LOGIN_ATTEMPTS',
  message: (minutes) =>
    `Trop de tentatives de connexion. Réessayez dans ${minutes} min.`,
};

const HOUR = 60 * 60_000;

/** Reset emails: few per address, so the route cannot be used to spam. */
export const FORGOT_PASSWORD_ATTEMPTS: AttemptLimitOptions = {
  scope: 'forgot-password',
  account: { bodyField: 'email' },
  perAccount: { limit: 3, ttl: HOUR },
  perAddress: { limit: 10, ttl: HOUR },
  code: 'TOO_MANY_ATTEMPTS',
  message: (minutes) =>
    `Trop de demandes de réinitialisation. Réessayez dans ${minutes} min.`,
};

/** Reset links: a token cannot be guessed, this only caps the noise. */
export const RESET_PASSWORD_ATTEMPTS: AttemptLimitOptions = {
  scope: 'reset-password',
  account: { bodyField: 'token' },
  perAccount: { limit: 5, ttl: 15 * 60_000 },
  perAddress: { limit: 20, ttl: 15 * 60_000 },
  code: 'TOO_MANY_ATTEMPTS',
  message: (minutes) => `Trop de tentatives. Réessayez dans ${minutes} min.`,
};

/** Changing the password checks the current one: same care as a login. */
export const CHANGE_PASSWORD_ATTEMPTS: AttemptLimitOptions = {
  scope: 'change-password',
  account: 'user',
  perAccount: { limit: 5, ttl: 15 * 60_000 },
  perAddress: { limit: 20, ttl: 15 * 60_000 },
  code: 'TOO_MANY_ATTEMPTS',
  message: (minutes) => `Trop de tentatives. Réessayez dans ${minutes} min.`,
};

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
