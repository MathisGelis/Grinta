import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

describe('Rate limits (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    user = await createUser(app, 'limited');
  });

  afterAll(() => app.close());

  const login = (identifier: string, ip: string, password = 'wrong-password') =>
    http(app)
      .post('/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ identifier, password });

  it('locks one account from one address, with Retry-After', async () => {
    for (let i = 0; i < 5; i++) await login(user.email, '10.0.0.1').expect(401);

    const blocked = await login(user.email, '10.0.0.1').expect(429);

    expect(blocked.body).toMatchObject({
      statusCode: 429,
      code: 'TOO_MANY_LOGIN_ATTEMPTS',
      message: expect.stringMatching(/^Trop de tentatives/) as unknown,
    });
    const seconds = (blocked.body as { retryAfterSeconds: number })
      .retryAfterSeconds;

    expect(seconds).toBeGreaterThan(0);
    expect(Number(blocked.headers['retry-after'])).toBe(seconds);
    // Even the right password waits.
    await login(user.email, '10.0.0.1', user.password).expect(429);
  });

  it('does not lock the neighbours behind the same address', async () => {
    const neighbour = await createUser(app, 'neighbour');

    await login(neighbour.uniqueName, '10.0.0.1', neighbour.password).expect(
      201,
    );
    await login(user.email, '10.0.0.2', user.password).expect(201);
  });

  it('answers the global limit with retryAfterSeconds too', async () => {
    let last = 0;
    let body: unknown;

    for (let i = 0; i < 70 && last !== 429; i++) {
      const res = await http(app)
        .get('/auth/me')
        .set('X-Forwarded-For', '10.9.9.9')
        .auth(user.token, { type: 'bearer' });

      last = res.status;
      body = res.body;
    }
    expect(last).toBe(429);
    expect(body).toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterSeconds: expect.any(Number) as unknown,
    });
  });
});
