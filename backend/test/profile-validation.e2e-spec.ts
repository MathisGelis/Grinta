import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

describe('Profile measures validation (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    user = await createUser(app, 'prof');
  });

  afterAll(() => app.close());

  const patch = (body: object) =>
    http(app)
      .patch(`/users/${user.id}`)
      .auth(user.token, { type: 'bearer' })
      .send(body);

  it.each([
    [{ height: 5000 }, 'VALUE_TOO_LARGE'],
    [{ height: 10 }, 'VALUE_TOO_SMALL'],
    [{ weight: -3 }, 'VALUE_TOO_SMALL'],
    [{ weight: 900 }, 'VALUE_TOO_LARGE'],
    [{ birthDate: '2099-01-01' }, 'DATE_OUT_OF_RANGE'],
    [{ birthDate: '1800-01-01' }, 'DATE_OUT_OF_RANGE'],
    [{ birthDate: new Date().toISOString().slice(0, 10) }, 'DATE_OUT_OF_RANGE'],
  ])('refuses %j with %s', async (body, code) => {
    const res = await patch(body).expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors[0].code).toBe(code);
  });

  it('accepts the limits', async () => {
    const adult = new Date();

    adult.setUTCFullYear(adult.getUTCFullYear() - 14);
    await patch({
      height: 50,
      weight: 400,
      birthDate: adult.toISOString().slice(0, 10),
    }).expect(200);
    await patch({ height: 250, weight: 20, birthDate: '1900-01-01' }).expect(
      200,
    );
  });
});
