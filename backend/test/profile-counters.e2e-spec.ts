import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

// Rule: the counters of a profile are public figures, even when the account
// is private; the lists behind them are not.
describe('Counters of a private profile (e2e)', () => {
  let app: NestExpressApplication;
  let owner: TestUser;
  let follower: TestUser;
  let stranger: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    [owner, follower, stranger] = await Promise.all([
      createUser(app, 'cntowner'),
      createUser(app, 'cntfollower'),
      createUser(app, 'cntstranger'),
    ]);
    await app
      .get(DataSource)
      .query('UPDATE users SET "isPublic" = false WHERE id = $1', [owner.id]);
    await app
      .get(DataSource)
      .query(
        `INSERT INTO connections ("followerId", "followingId") VALUES ($1, $2)`,
        [follower.id, owner.id],
      );
  });

  afterAll(() => app.close());

  const as = (user: TestUser, path: string) =>
    http(app).get(path).auth(user.token, { type: 'bearer' });

  it('shows the same counters to everyone and hides the lists from strangers', async () => {
    const asStranger = (
      await as(stranger, `/users/${owner.id}/profile`).expect(200)
    ).body;
    const asFollower = (
      await as(follower, `/users/${owner.id}/profile`).expect(200)
    ).body;

    expect(asStranger.isPrivate).toBe(true);
    expect(asStranger.followersCount).toBe(1);
    expect(asStranger.followersCount).toBe(asFollower.followersCount);
    expect(asFollower.isPrivate).toBe(false);
    await as(stranger, `/connections/${owner.id}/followers`).expect(404);
    const list = await as(
      follower,
      `/connections/${owner.id}/followers`,
    ).expect(200);

    expect(list.body).toHaveLength(asFollower.followersCount);
  });
});
