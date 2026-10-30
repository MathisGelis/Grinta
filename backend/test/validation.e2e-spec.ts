import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http } from './e2e-utils';

describe('Validation errors (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(() => app.close());

  it('returns the structured body at the top level', async () => {
    const res = await http(app)
      .post('/users/register')
      .send({
        displayName: 'X',
        uniqueName: 'ok.name',
        email: 'nope',
        password: 'short',
        extra: 1,
      })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: expect.any(String) as string,
    });
    const codes = (
      res.body as { errors: Array<{ field: string; code: string }> }
    ).errors.map((e) => `${e.field}:${e.code}`);

    expect(codes).toEqual(
      expect.arrayContaining([
        'email:EMAIL_INVALID',
        'password:PASSWORD_TOO_SHORT',
        'extra:FIELD_NOT_ALLOWED',
      ]),
    );
  });

  it('validates query strings the same way', async () => {
    const user = await createUser(app, 'query');
    const res = await http(app)
      .get('/workouts/planned/suggestion?period=year')
      .auth(user.token, { type: 'bearer' })
      .expect(400);

    expect(res.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      errors: [{ field: 'period', code: 'VALUE_NOT_ALLOWED' }],
    });
  });
});
