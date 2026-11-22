import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

describe('Stats insights as codes (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    user = await createUser(app, 'insights');
  });

  afterAll(() => app.close());

  it('balance returns codes', async () => {
    const res = await http(app)
      .get('/stats/balance?period=week')
      .auth(user.token, { type: 'bearer' })
      .expect(200);

    expect((res.body as { insights: string[] }).insights).toEqual([
      'INSUFFICIENT_PULL_VOLUME',
      'NO_LOWER_BODY_VOLUME',
    ]);
  });

  it('comparisons return codes', async () => {
    const res = await http(app)
      .get('/stats/comparisons?period=week')
      .auth(user.token, { type: 'bearer' })
      .expect(200);

    expect((res.body as { insights: string[] }).insights).toEqual([
      'NOT_ENOUGH_HISTORY',
    ]);
  });
});
