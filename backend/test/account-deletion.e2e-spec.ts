import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import {
  createE2eApp,
  createPost,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

describe('Account deletion (e2e)', () => {
  let app: NestExpressApplication;
  let leaver: TestUser;
  let friend: TestUser;
  let friendPostId: string;
  let leaverPostId: string;
  let db: DataSource;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    db = app.get(DataSource);
    const bench = await exerciseId(app, 'Bench Press (Barbell)');

    leaver = await createUser(app, 'leaver');
    friend = await createUser(app, 'friend');
    friendPostId = await createPost(app, friend, bench);
    leaverPostId = await createPost(app, leaver, bench);
  });

  afterAll(() => app.close());

  const as = (u: TestUser) => ({
    get: (path: string) =>
      http(app).get(path).auth(u.token, { type: 'bearer' }),
    post: (path: string, body: object = {}) =>
      http(app).post(path).auth(u.token, { type: 'bearer' }).send(body),
    patch: (path: string) =>
      http(app).patch(path).auth(u.token, { type: 'bearer' }),
  });
  const count = async (sql: string, params: unknown[]) => {
    const rows = await db.query<Array<{ n: string }>>(sql, params);

    return Number(rows[0].n);
  };

  it('deletes everything the account owns, and nothing else', async () => {
    // The leaver likes and comments on the friend's post, follows them, and
    // owns a group and an avatar.
    await as(leaver).patch(`/posts/${friendPostId}/like`).expect(200);
    await as(leaver)
      .post(`/posts/${friendPostId}/comments`, { content: 'Bravo' })
      .expect(201);
    await as(leaver).post(`/connections/${friend.id}/follow`).expect(201);
    await as(leaver).post('/groups', { name: 'Leaver group' }).expect(201);
    await db.query(`UPDATE users SET "avatarUrl" = $1 WHERE id = $2`, [
      '/uploads/gone.webp',
      leaver.id,
    ]);
    const before = (await as(friend).get(`/posts/${friendPostId}`).expect(200))
      .body;

    expect(before.likesCount).toBe(1);
    expect(before.commentsCount).toBe(1);

    await as(leaver).get(`/users/${leaver.id}`).expect(200);
    await http(app)
      .delete(`/users/${leaver.id}`)
      .auth(leaver.token, { type: 'bearer' })
      .expect(200);

    // The old token no longer works, at once.
    await as(leaver).get('/auth/me').expect(401);
    await http(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '40.0.0.1')
      .send({ identifier: leaver.email, password: leaver.password })
      .expect(401);

    // Nothing left in the database.
    for (const [table, column] of [
      ['completed_workouts', 'userId'],
      ['posts', 'userId'],
      ['post_likes', 'userId'],
      ['post_comments', 'userId'],
      ['connections', 'followerId'],
      ['groups', 'creatorId'],
      ['group_members', 'userId'],
    ])
      expect(
        await count(
          `SELECT COUNT(*) AS n FROM ${table} WHERE "${column}" = $1`,
          [leaver.id],
        ),
      ).toBe(0);
    await as(friend).get(`/posts/${leaverPostId}`).expect(404);

    // The friend's post is intact and its counters forgot the leaver.
    const after = (await as(friend).get(`/posts/${friendPostId}`).expect(200))
      .body;

    expect(after.likesCount).toBe(0);
    expect(after.commentsCount).toBe(0);

    // The same e-mail can sign up again.
    await http(app)
      .post('/users/register')
      .set('X-Forwarded-For', '40.0.0.2')
      .send({
        email: leaver.email,
        password: leaver.password,
        displayName: 'Back',
        uniqueName: leaver.uniqueName,
      })
      .expect(201);
  });

  it('answers 403 when deleting someone else, and 401 without a token', async () => {
    await http(app)
      .delete(`/users/${friend.id}`)
      .auth(leaver.token, { type: 'bearer' })
      .expect(401);
    const other = await createUser(app, 'intruder');

    await http(app)
      .delete(`/users/${friend.id}`)
      .auth(other.token, { type: 'bearer' })
      .expect(403);
  });
});
