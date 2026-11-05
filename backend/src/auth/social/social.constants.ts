import type { AttemptLimitOptions } from '../../common/throttling/attempt-limit';

// A forged token costs a signature check: the per-address limit is the one
// that matters, the per-token one only stops replaying the same token.
const socialAttempts = (
  scope: string,
  bodyField: string,
): AttemptLimitOptions => ({
  scope,
  account: { bodyField },
  perAccount: { limit: 10, ttl: 15 * 60_000 },
  perAddress: { limit: 30, ttl: 15 * 60_000 },
  code: 'TOO_MANY_LOGIN_ATTEMPTS',
  message: (minutes) =>
    `Trop de tentatives de connexion. Réessayez dans ${minutes} min.`,
});

export const appleLoginAttempts = socialAttempts(
  'apple-login',
  'identityToken',
);
export const googleLoginAttempts = socialAttempts('google-login', 'idToken');
