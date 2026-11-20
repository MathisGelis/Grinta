import {
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
import { IdentityProvider } from './user-identity.entity';

interface ProviderConfig {
  issuers: string[];
  jwksUrl: string;
  /** Comma-separated client ids accepted as audience. */
  audienceEnv: string;
}

export const PROVIDERS: Record<IdentityProvider, ProviderConfig> = {
  [IdentityProvider.APPLE]: {
    issuers: ['https://appleid.apple.com'],
    jwksUrl: 'https://appleid.apple.com/auth/keys',
    audienceEnv: 'APPLE_CLIENT_IDS',
  },
  [IdentityProvider.GOOGLE]: {
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    audienceEnv: 'GOOGLE_CLIENT_IDS',
  },
};

/** The public keys of each provider; tests replace them with local keys. */
export const SOCIAL_KEY_SETS = Symbol('SOCIAL_KEY_SETS');
export type SocialKeySets = Record<IdentityProvider, JWTVerifyGetKey>;

/** jose caches the fetched keys and refetches on an unknown key id. */
export const remoteKeySets = (): SocialKeySets => ({
  [IdentityProvider.APPLE]: createRemoteJWKSet(
    new URL(PROVIDERS[IdentityProvider.APPLE].jwksUrl),
  ),
  [IdentityProvider.GOOGLE]: createRemoteJWKSet(
    new URL(PROVIDERS[IdentityProvider.GOOGLE].jwksUrl),
  ),
});

export interface SocialClaims {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

const invalid = () =>
  new UnauthorizedException({
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'SOCIAL_TOKEN_INVALID',
    message: 'Connexion refusée : le jeton Apple ou Google est invalide.',
  });

/**
 * Checks an Apple identityToken or a Google idToken: RS256 signature against
 * the provider's published keys, issuer, audience (our client ids, from the
 * environment) and expiry. The token itself is never logged.
 */
@Injectable()
export class SocialTokenVerifier {
  constructor(
    private readonly config: ConfigService,
    @Inject(SOCIAL_KEY_SETS) private readonly keySets: SocialKeySets,
  ) {}

  async verify(
    provider: IdentityProvider,
    token: string,
  ): Promise<SocialClaims> {
    const { issuers, audienceEnv } = PROVIDERS[provider];
    const audience = (this.config.get<string>(audienceEnv) ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!audience.length)
      throw new ServiceUnavailableException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'SOCIAL_LOGIN_NOT_CONFIGURED',
        message: 'Cette méthode de connexion n’est pas encore disponible.',
      });

    let payload: Record<string, unknown>;

    try {
      ({ payload } = await jwtVerify(token, this.keySets[provider], {
        issuer: issuers,
        audience,
        algorithms: ['RS256'],
        clockTolerance: 30,
      }));
    } catch {
      throw invalid();
    }
    if (typeof payload.sub !== 'string' || !payload.sub) throw invalid();
    const email =
      typeof payload.email === 'string' ? payload.email.toLowerCase() : null;

    return {
      subject: payload.sub,
      email,
      // Apple sends "true" as a string, Google a boolean.
      emailVerified:
        payload.email_verified === true || payload.email_verified === 'true',
      name: typeof payload.name === 'string' ? payload.name : null,
    };
  }
}
