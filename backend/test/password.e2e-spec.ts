import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { MailMessage, MailService } from '../src/mail/mail.service';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

describe('Password reset and change (e2e)', () => {
  let app: NestExpressApplication;
  const outbox: MailMessage[] = [];
  const mail: MailService = {
    send: (message: MailMessage) => {
      outbox.push(message);
      return Promise.resolve();
    },
  };

  beforeAll(async () => {
    app = await createE2eApp((builder) =>
      builder.overrideProvider(MailService).useValue(mail),
    );
  });

  afterAll(() => app.close());

  // The email leaves in the background, after the 204.
  async function linkSentTo(email: string): Promise<string> {
    for (let i = 0; i < 50; i++) {
      const message = outbox.find((m) => m.to === email);

      if (message) return /token=([\w-]+)/.exec(message.text)![1];
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`No email to ${email}`);
  }

  const login = (user: TestUser, password: string, ip: string) =>
    http(app)
      .post('/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ identifier: user.email, password });
  const me = (token: string) =>
    http(app).get('/auth/me').auth(token, { type: 'bearer' });

  it('answers 204 for an unknown email, and sends nothing', async () => {
    await http(app)
      .post('/auth/forgot-password')
      .set('X-Forwarded-For', '20.0.0.1')
      .send({ email: 'nobody@e2e.example.com' })
      .expect(204);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(
      outbox.find((m) => m.to === 'nobody@e2e.example.com'),
    ).toBeUndefined();
  });

  it('resets the password once, and logs out the old sessions', async () => {
    const user = await createUser(app, 'forgot');

    await me(user.token).expect(200);
    await http(app)
      .post('/auth/forgot-password')
      .set('X-Forwarded-For', '20.0.0.2')
      .send({ email: user.email.toUpperCase() })
      .expect(204);
    const token = await linkSentTo(user.email);
    const [stored] = await app
      .get(DataSource)
      .query<Array<{ tokenHash: string }>>(
        `SELECT "tokenHash" FROM password_reset_tokens t
           JOIN users u ON u.id = t."userId" WHERE u.email = $1`,
        [user.email],
      );

    expect(stored.tokenHash).not.toBe(token);
    expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);

    const short = await http(app)
      .post('/auth/reset-password')
      .send({ token, password: 'court' })
      .expect(400);

    expect(short.body).toMatchObject({
      errors: [{ field: 'password', code: 'PASSWORD_TOO_SHORT' }],
    });
    // A token issued in the same second as the reset still counts as new.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await http(app)
      .post('/auth/reset-password')
      .send({ token, password: 'NouveauMotDePasse1' })
      .expect(204);

    await me(user.token).expect(401);
    await login(user, user.password, '20.0.1.1').expect(401);
    await login(user, 'NouveauMotDePasse1', '20.0.1.1').expect(201);

    const reused = await http(app)
      .post('/auth/reset-password')
      .send({ token, password: 'EncoreAutreChose1' })
      .expect(400);

    expect(reused.body).toMatchObject({ code: 'RESET_TOKEN_INVALID' });
  });

  it('refuses an expired link, and a new request replaces the old link', async () => {
    const user = await createUser(app, 'expired');
    const ask = () =>
      http(app)
        .post('/auth/forgot-password')
        .set('X-Forwarded-For', '20.0.0.3')
        .send({ email: user.email })
        .expect(204);

    await ask();
    const first = await linkSentTo(user.email);

    outbox.length = 0;
    await ask();
    const second = await linkSentTo(user.email);

    await http(app)
      .post('/auth/reset-password')
      .send({ token: first, password: 'NouveauMotDePasse1' })
      .expect(400);
    await app
      .get(DataSource)
      .query(
        `UPDATE password_reset_tokens SET "expiresAt" = now() - interval '1 minute'`,
      );
    await http(app)
      .post('/auth/reset-password')
      .send({ token: second, password: 'NouveauMotDePasse1' })
      .expect(400);
  });

  it('limits reset requests per email and address', async () => {
    const user = await createUser(app, 'spam');
    const ask = () =>
      http(app)
        .post('/auth/forgot-password')
        .set('X-Forwarded-For', '20.0.0.4')
        .send({ email: user.email });

    for (let i = 0; i < 3; i++) await ask().expect(204);
    const blocked = await ask().expect(429);

    expect(blocked.body).toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('changes the password with the current one', async () => {
    const user = await createUser(app, 'change');
    const other = await createUser(app, 'unrelated');
    const change = (token: string, body: object) =>
      http(app)
        .patch('/users/me/password')
        .auth(token, { type: 'bearer' })
        .send(body);

    const wrong = await change(user.token, {
      currentPassword: 'pas-le-bon',
      newPassword: 'NouveauMotDePasse1',
    }).expect(400);

    expect(wrong.body).toMatchObject({ code: 'CURRENT_PASSWORD_INVALID' });
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const changed = await change(user.token, {
      currentPassword: user.password,
      newPassword: 'NouveauMotDePasse1',
    }).expect(200);
    const fresh = (changed.body as { access_token: string }).access_token;

    await me(fresh).expect(200);
    await me(user.token).expect(401);
    await login(user, 'NouveauMotDePasse1', '20.0.2.1').expect(201);
    // Someone else is not affected.
    await me(other.token).expect(200);
    await change('not-a-token', {
      currentPassword: 'x',
      newPassword: 'NouveauMotDePasse1',
    }).expect(401);
  });

  it('limits password changes per user, not per caller', async () => {
    const a = await createUser(app, 'lock');
    const b = await createUser(app, 'free');
    const wrong = (user: TestUser) =>
      http(app)
        .patch('/users/me/password')
        .set('X-Forwarded-For', '20.0.3.1')
        .auth(user.token, { type: 'bearer' })
        .send({ currentPassword: 'pas-le-bon', newPassword: 'Peu importe 1' });

    for (let i = 0; i < 5; i++) await wrong(a).expect(400);
    await wrong(a).expect(429);
    await wrong(b).expect(400);
  });

  it('refuses the token of a deleted account', async () => {
    const user = await createUser(app, 'deleted');

    await app
      .get(DataSource)
      .query('DELETE FROM users WHERE id = $1', [user.id]);
    await me(user.token).expect(401);
  });
});
