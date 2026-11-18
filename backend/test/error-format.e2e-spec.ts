import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http } from './e2e-utils';

describe('Uniform error format and body limits (e2e)', () => {
  let app: NestExpressApplication;
  let token: string;

  beforeAll(async () => {
    app = await createE2eApp();
    token = (await createUser(app, 'errfmt')).token;
  });

  afterAll(() => app.close());

  it('answers 404 as { statusCode, code, message } with a string message', async () => {
    const res = await http(app)
      .get('/posts/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Forwarded-For', '10.9.0.1')
      .expect(404);

    expect(res.body).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: expect.any(String) as string,
    });
  });

  it('answers 401 with code UNAUTHORIZED', async () => {
    const res = await http(app)
      .get('/users/me')
      .set('X-Forwarded-For', '10.9.0.2')
      .expect(401);

    expect(res.body).toEqual({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: expect.any(String) as string,
    });
  });

  it('answers 413 PAYLOAD_TOO_LARGE for a body over 100 KB', async () => {
    const res = await http(app)
      .post('/workouts/import')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Forwarded-For', '10.9.0.3')
      .send({ text: 'a'.repeat(200_000) })
      .expect(413);

    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('gives the duplicate e-mail a stable code and throttles probing', async () => {
    const email = `errfmt-dup-${Date.now()}@example.com`;
    const body = {
      email,
      password: 'Password123!',
      displayName: 'Dup',
      uniqueName: `dup${Date.now() % 1e8}`,
    };
    const ip = '10.9.0.4';
    const send = () =>
      http(app).post('/users/register').set('X-Forwarded-For', ip).send(body);

    await send().expect(201);
    const dup = await send();

    expect(dup.status).toBe(400);
    expect(dup.body.code).toBe('EMAIL_IN_USE');
    for (let i = 0; i < 3; i++) await send();
    const limited = await send();

    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe('TOO_MANY_ATTEMPTS');
  });
});
