import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http } from './e2e-utils';

describe('Security headers (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(() => app.close());

  it('sets the helmet headers on every response', async () => {
    const res = await http(app).get('/health').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=/);
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('does not put the e-mail in the token', async () => {
    const user = await createUser(app, 'jwt');
    const login = await http(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '50.0.0.1')
      .send({ identifier: user.email, password: user.password })
      .expect(201);
    const payload = JSON.parse(
      Buffer.from(
        (login.body as { access_token: string }).access_token.split('.')[1],
        'base64url',
      ).toString(),
    ) as Record<string, unknown>;

    expect(payload).not.toHaveProperty('email');
    expect(payload.sub).toBe(user.id);
  });
});
