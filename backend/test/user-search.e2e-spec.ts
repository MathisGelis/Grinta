import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

describe('User search (e2e)', () => {
  let app: NestExpressApplication;
  let me: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    me = await createUser(app, 'searcher');
    for (let i = 0; i < 3; i++) await createUser(app, 'findable');
  });

  afterAll(() => app.close());

  const search = async (q: string) =>
    (
      await http(app)
        .get('/users/search')
        .query({ q })
        .auth(me.token, { type: 'bearer' })
        .expect(200)
    ).body as Array<{ uniqueName: string }>;

  it.each(['%', '_', '\\', '%%', 'a', ' '])(
    'does not list people for the wildcard or short query %j',
    async (q) => expect(await search(q)).toEqual([]),
  );

  it('does not treat % or _ inside a query as a wildcard', async () => {
    expect(await search('qqq%')).toEqual([]);
    expect(await search('q_q')).toEqual([]);
  });

  it('still finds people by name', async () => {
    const found = await search('findable');

    expect(found.length).toBeGreaterThanOrEqual(3);
    expect(found.length).toBeLessThanOrEqual(10);
  });
});
