import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  JWTPayload,
  KeyLike,
  SignJWT,
} from 'jose';
import { DataSource } from 'typeorm';
import { SOCIAL_KEY_SETS } from '../src/auth/social/social-token.verifier';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

const APPLE_ISSUER = 'https://appleid.apple.com';
const GOOGLE_ISSUER = 'https://accounts.google.com';
const APPLE_AUDIENCE = 'com.grinta.app';
const GOOGLE_AUDIENCE = 'grinta-ios.apps.googleusercontent.com';

// Apple and Google are played by a local key: same RS256 tokens, signed here.
describe('Sign in with Apple and Google (e2e)', () => {
  let app: NestExpressApplication;
  let key: KeyLike;
  let otherKey: KeyLike;
  let existing: TestUser;
  let n = 0;

  const sign = (
    claims: JWTPayload,
    options: {
      issuer?: string;
      audience?: string;
      expires?: string | number;
      signer?: KeyLike;
      kid?: string;
    } = {},
  ) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: options.kid ?? 'test-key' })
      .setIssuer(options.issuer ?? GOOGLE_ISSUER)
      .setAudience(options.audience ?? GOOGLE_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(options.expires ?? '10m')
      .sign(options.signer ?? key);

  const unique = () => `${Date.now()}${n++}`;
  const post = (path: string, body: object) =>
    http(app)
      .post(path)
      .set('X-Forwarded-For', `40.0.0.${n++ % 250}`)
      .send(body);
  const me = async (token: string) =>
    (
      await http(app)
        .get('/auth/me')
        .auth(token, { type: 'bearer' })
        .expect(200)
    ).body as { id: string; email: string };

  beforeAll(async () => {
    process.env.APPLE_CLIENT_IDS = `other.app, ${APPLE_AUDIENCE}`;
    process.env.GOOGLE_CLIENT_IDS = GOOGLE_AUDIENCE;
    ({ privateKey: key } = await generateKeyPair('RS256'));
    ({ privateKey: otherKey } = await generateKeyPair('RS256'));
    const jwk = { ...(await exportJWK(key)), kid: 'test-key', alg: 'RS256' };
    // Only the public part is published.
    const { d, p, q, dp, dq, qi, ...publicJwk } = jwk;
    void [d, p, q, dp, dq, qi];
    const keySet = createLocalJWKSet({ keys: [publicJwk] });

    app = await createE2eApp((builder) =>
      builder
        .overrideProvider(SOCIAL_KEY_SETS)
        .useValue({ apple: keySet, google: keySet }),
    );
    existing = await createUser(app, 'socialexisting');
  });

  afterAll(() => app.close());

  it('creates an account on the first Google sign-in, then signs it in', async () => {
    const id = unique();
    const token = await sign({
      sub: `google-${id}`,
      email: `New.Google${id}@Example.com`,
      email_verified: true,
      name: 'Élodie Martin',
    });
    const first = await post('/auth/google', { idToken: token }).expect(200);

    expect(first.body).toMatchObject({ isNewUser: true });
    const user = await me(
      (first.body as { access_token: string }).access_token,
    );

    expect(user.email).toBe(`new.google${id}@example.com`);
    const [row] = await app
      .get(DataSource)
      .query<
        Array<{ displayName: string; uniqueName: string }>
      >('SELECT "displayName", "uniqueName" FROM users WHERE id = $1', [user.id]);

    expect(row.displayName).toBe('Élodie Martin');
    expect(row.uniqueName).toMatch(/^elodiemartin\d*$/);

    const again = await post('/auth/google', { idToken: token }).expect(200);

    expect(again.body).toMatchObject({ isNewUser: false });
    expect(
      (await me((again.body as { access_token: string }).access_token)).id,
    ).toBe(user.id);
  });

  it('links an Apple account to the account with the same verified email', async () => {
    const token = await sign(
      {
        sub: `apple-${unique()}`,
        email: existing.email.toUpperCase(),
        email_verified: 'true',
      },
      { issuer: APPLE_ISSUER, audience: APPLE_AUDIENCE },
    );
    const res = await post('/auth/apple', { identityToken: token }).expect(200);

    expect(res.body).toMatchObject({ isNewUser: false });
    expect(
      (await me((res.body as { access_token: string }).access_token)).id,
    ).toBe(existing.id);
  });

  it('names a new Apple account from the fullName the app sends', async () => {
    const id = unique();
    const token = await sign(
      {
        sub: `apple-${id}`,
        email: `${id}@privaterelay.appleid.com`,
        email_verified: 'true',
      },
      { issuer: APPLE_ISSUER, audience: APPLE_AUDIENCE },
    );
    const res = await post('/auth/apple', {
      identityToken: token,
      fullName: { givenName: 'Lucas', familyName: 'Moreau' },
    }).expect(200);
    const user = await me((res.body as { access_token: string }).access_token);
    const [row] = await app
      .get(DataSource)
      .query<
        Array<{ displayName: string }>
      >('SELECT "displayName" FROM users WHERE id = $1', [user.id]);

    expect(res.body).toMatchObject({ isNewUser: true });
    expect(row.displayName).toBe('Lucas Moreau');
  });

  it('refuses an email the provider did not verify', async () => {
    const token = await sign({
      sub: `google-${unique()}`,
      email: existing.email,
      email_verified: false,
    });
    const res = await post('/auth/google', { idToken: token }).expect(401);

    expect(res.body).toMatchObject({ code: 'SOCIAL_EMAIL_NOT_VERIFIED' });
  });

  it('refuses forged, expired or misaddressed tokens', async () => {
    const claims = {
      sub: `google-${unique()}`,
      email: existing.email,
      email_verified: true,
    };
    const bad = {
      'other key': await sign(claims, { signer: otherKey }),
      'other audience': await sign(claims, { audience: 'someone.else' }),
      'other issuer': await sign(claims, { issuer: 'https://evil.example' }),
      'apple token on google': await sign(claims, {
        issuer: APPLE_ISSUER,
        audience: APPLE_AUDIENCE,
      }),
      expired: await sign(claims, {
        expires: Math.floor(Date.now() / 1000) - 120,
      }),
      'unknown key id': await sign(claims, { kid: 'nope' }),
      'not a jwt': 'not.a.jwt',
    };

    for (const [kind, idToken] of Object.entries(bad)) {
      const res = await post('/auth/google', { idToken });

      expect([kind, res.status, (res.body as { code?: string }).code]).toEqual([
        kind,
        401,
        'SOCIAL_TOKEN_INVALID',
      ]);
    }
    await post('/auth/google', {}).expect(400);
  });

  it('answers 503 while a provider has no client id', async () => {
    const saved = process.env.APPLE_CLIENT_IDS;

    delete process.env.APPLE_CLIENT_IDS;
    try {
      const res = await post('/auth/apple', { identityToken: 'x' }).expect(503);

      expect(res.body).toMatchObject({ code: 'SOCIAL_LOGIN_NOT_CONFIGURED' });
    } finally {
      process.env.APPLE_CLIENT_IDS = saved;
    }
  });
});
