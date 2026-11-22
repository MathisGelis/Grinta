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

// Who may read the workouts and the follower lists of an account: the owner,
// the people who follow them and, for a public account, anyone, but only for
// the workouts they published. Planned workouts are the owner's alone.
describe('Access to the content of a private account (e2e)', () => {
  let app: NestExpressApplication;
  let owner: TestUser;
  let follower: TestUser;
  let stranger: TestUser;
  let postedId: string;
  let unpostedId: string;
  let plannedId: string;
  let postId: string;

  const as = (user: TestUser) => ({
    get: (path: string) =>
      http(app).get(path).auth(user.token, { type: 'bearer' }),
  });
  const setPublic = (isPublic: boolean) =>
    app
      .get(DataSource)
      .query('UPDATE users SET "isPublic" = $2 WHERE id = $1', [
        owner.id,
        isPublic,
      ]);

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    [owner, follower, stranger] = await Promise.all([
      createUser(app, 'acowner'),
      createUser(app, 'acfollower'),
      createUser(app, 'acstranger'),
    ]);
    const bench = await exerciseId(app, 'Bench Press (Barbell)');

    postId = await createPost(app, owner, bench);
    postedId = (
      (await as(owner).get(`/posts/${postId}`).expect(200)).body as {
        workoutId: string;
      }
    ).workoutId;
    unpostedId = (
      (
        await http(app)
          .post('/workouts/completed')
          .auth(owner.token, { type: 'bearer' })
          .send({
            title: 'Privée',
            completionDate: new Date().toISOString(),
            totalDurationSeconds: 1200,
            exercises: [
              { exerciseId: bench, sets: [{ reps: 10, weight: 40 }] },
            ],
          })
          .expect(201)
      ).body as { id: string }
    ).id;
    plannedId = (
      (
        await http(app)
          .post('/workouts/planned')
          .auth(owner.token, { type: 'bearer' })
          .send({ title: 'Plan', exercises: [{ exerciseId: bench }] })
          .expect(201)
      ).body as { id: string }
    ).id;
    await app
      .get(DataSource)
      .query(
        'INSERT INTO connections ("followerId", "followingId") VALUES ($1, $2)',
        [follower.id, owner.id],
      );
  });

  afterAll(() => app.close());

  describe('private account', () => {
    beforeAll(() => setPublic(false));

    it('shows a stranger nothing', async () => {
      for (const path of [
        `/workouts/completed/${postedId}`,
        `/workouts/completed/${unpostedId}`,
        `/workouts/planned/${plannedId}`,
        `/connections/${owner.id}/followers`,
        `/connections/${owner.id}/following`,
        `/posts/${postId}`,
        `/stats/summary?period=week&userId=${owner.id}`,
      ])
        await as(stranger).get(path).expect(404);
    });

    it('gives a follower the workouts, but not the planned ones', async () => {
      await as(follower).get(`/workouts/completed/${postedId}`).expect(200);
      await as(follower).get(`/workouts/completed/${unpostedId}`).expect(200);
      await as(follower).get(`/connections/${owner.id}/followers`).expect(200);
      await as(follower).get(`/connections/${owner.id}/following`).expect(200);
      await as(follower).get(`/workouts/planned/${plannedId}`).expect(404);
    });

    it('gives the owner everything', async () => {
      for (const path of [
        `/workouts/completed/${postedId}`,
        `/workouts/completed/${unpostedId}`,
        `/workouts/planned/${plannedId}`,
        `/connections/${owner.id}/followers`,
        `/connections/${owner.id}/following`,
      ])
        await as(owner).get(path).expect(200);
    });
  });

  describe('public account', () => {
    beforeAll(() => setPublic(true));

    it('shows a stranger what was published and the lists', async () => {
      await as(stranger).get(`/workouts/completed/${postedId}`).expect(200);
      await as(stranger).get(`/connections/${owner.id}/followers`).expect(200);
    });

    it('keeps unpublished and planned workouts to the owner and followers', async () => {
      await as(stranger).get(`/workouts/completed/${unpostedId}`).expect(404);
      await as(stranger).get(`/workouts/planned/${plannedId}`).expect(404);
      await as(follower).get(`/workouts/completed/${unpostedId}`).expect(200);
    });
  });

  it('answers 404 for a workout that does not exist', async () => {
    const unknown = '7f1c3a6e-2b4d-4c8e-9a0b-1d2e3f405162';

    await as(stranger).get(`/workouts/completed/${unknown}`).expect(404);
    await as(stranger).get(`/workouts/planned/${unknown}`).expect(404);
  });
});
