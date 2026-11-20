import { NestExpressApplication } from '@nestjs/platform-express';
import { MailMessage, MailService } from '../src/mail/mail.service';
import { createE2eApp, createUser, http } from './e2e-utils';

describe('Account security: e-mail and password changes (e2e)', () => {
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

  it('refuses email and password in PATCH /users/:id', async () => {
    const user = await createUser(app, 'sec');

    for (const body of [{ password: 'Hacked123!' }, { email: 'x@evil.com' }]) {
      const res = await http(app)
        .patch(`/users/${user.id}`)
        .auth(user.token, { type: 'bearer' })
        .send(body)
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors[0].code).toBe('FIELD_NOT_ALLOWED');
    }
    await http(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '30.0.0.1')
      .send({ identifier: user.email, password: user.password })
      .expect(201);
  });

  it('changes the e-mail only after the link, and retires old tokens', async () => {
    const user = await createUser(app, 'mailchg');
    const newEmail = `new-${user.email}`;
    const request = (password: string, email = newEmail) =>
      http(app)
        .post('/users/me/email')
        .auth(user.token, { type: 'bearer' })
        .send({ email, currentPassword: password });

    const wrong = await request('wrong-password').expect(400);

    expect(wrong.body.code).toBe('CURRENT_PASSWORD_INVALID');
    await request(user.password).expect(204);

    // Link to the new address, notice to the old one, e-mail unchanged yet.
    const link = outbox.find((m) => m.to === newEmail)!;
    const notice = outbox.find((m) => m.to === user.email)!;

    expect(notice).toBeDefined();
    expect(notice.text).not.toMatch(/token=/);
    await http(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '30.0.0.2')
      .send({ identifier: user.email, password: user.password })
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const token = /token=([\w-]+)/.exec(link.text)![1];

    await http(app).post('/auth/confirm-email').send({ token }).expect(204);
    await http(app).post('/auth/confirm-email').send({ token }).expect(400);
    await http(app)
      .get('/auth/me')
      .auth(user.token, { type: 'bearer' })
      .expect(401);
    await http(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '30.0.0.3')
      .send({ identifier: newEmail, password: user.password })
      .expect(201);
  });

  it('refuses an address already in use', async () => {
    const user = await createUser(app, 'mailtaken');
    const other = await createUser(app, 'mailowner');
    const res = await http(app)
      .post('/users/me/email')
      .auth(user.token, { type: 'bearer' })
      .send({ email: other.email, currentPassword: user.password })
      .expect(400);

    expect(res.body.code).toBe('EMAIL_IN_USE');
  });

  it('answers USERNAME_TAKEN with a suggestion', async () => {
    const user = await createUser(app, 'uname');
    const other = await createUser(app, 'unameother');
    const res = await http(app)
      .patch(`/users/${user.id}`)
      .auth(user.token, { type: 'bearer' })
      .send({ uniqueName: other.uniqueName })
      .expect(400);

    expect(res.body.code).toBe('USERNAME_TAKEN');
    expect(res.body.suggestion).toEqual(expect.any(String));
  });
});
