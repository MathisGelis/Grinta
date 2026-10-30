import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

describe('Gender and goal (e2e)', () => {
  let app: NestExpressApplication;
  let me: TestUser;
  let other: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    me = await createUser(app, 'onboard');
    other = await createUser(app, 'viewer');
  });

  afterAll(() => app.close());

  const patch = (body: object) =>
    http(app)
      .patch(`/users/${me.id}`)
      .auth(me.token, { type: 'bearer' })
      .send(body);

  it('stores them and shows them to their owner only', async () => {
    await patch({ gender: 'female', goal: 'get_fitter' }).expect(200);

    const own = await http(app)
      .get(`/users/${me.id}`)
      .auth(me.token, { type: 'bearer' })
      .expect(200);

    expect(own.body).toMatchObject({ gender: 'female', goal: 'get_fitter' });
    expect(own.body).not.toHaveProperty('password');

    const seen = await http(app)
      .get(`/users/${me.id}`)
      .auth(other.token, { type: 'bearer' })
      .expect(200);

    expect(seen.body).not.toHaveProperty('gender');
    expect(seen.body).not.toHaveProperty('goal');
  });

  it('refuses unknown values and clears with null', async () => {
    const bad = await patch({ gender: 'robot', goal: 'win' }).expect(400);

    expect(bad.body).toMatchObject({
      errors: expect.arrayContaining([
        expect.objectContaining({ field: 'gender', code: 'VALUE_NOT_ALLOWED' }),
        expect.objectContaining({ field: 'goal', code: 'VALUE_NOT_ALLOWED' }),
      ]) as unknown,
    });
    await patch({ gender: null, goal: null }).expect(200);

    const own = await http(app)
      .get(`/users/${me.id}`)
      .auth(me.token, { type: 'bearer' })
      .expect(200);

    expect(own.body).toMatchObject({ gender: null, goal: null });
  });
});
