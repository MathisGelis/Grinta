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

const STATS_ROUTES = [
  '/stats/summary?period=week',
  '/stats/muscle-distribution?period=week',
  '/stats/balance?period=week',
  '/stats/consistency',
  '/stats/muscle-frequency',
];

describe("Another user's profile and stats (e2e)", () => {
  let app: NestExpressApplication;
  let owner: TestUser;
  let follower: TestUser;
  let stranger: TestUser;
  let bench: string;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    [owner, follower, stranger] = await Promise.all([
      createUser(app, 'statsowner'),
      createUser(app, 'statsfan'),
      createUser(app, 'statsstranger'),
    ]);
    bench = await exerciseId(app, 'Bench Press (Barbell)');
    // A heavy owner: their own calories differ from the 70 kg default.
    await http(app)
      .patch(`/users/${owner.id}`)
      .auth(owner.token, { type: 'bearer' })
      .send({ weight: 100 })
      .expect(200);
    await createPost(app, owner, bench);
    // An unpublished workout: it only counts in the owner's own stats.
    await http(app)
      .post('/workouts/completed')
      .auth(owner.token, { type: 'bearer' })
      .send({
        title: 'Privée',
        completionDate: new Date().toISOString(),
        totalDurationSeconds: 1200,
        exercises: [{ exerciseId: bench, sets: [{ reps: 10, weight: 40 }] }],
      })
      .expect(201);

    const db = app.get(DataSource);

    await db.query('UPDATE users SET "isPublic" = false WHERE id = $1', [
      owner.id,
    ]);
    await db.query(
      'INSERT INTO connections ("followerId", "followingId") VALUES ($1, $2)',
      [follower.id, owner.id],
    );
  });

  afterAll(() => app.close());

  const get = (viewer: TestUser, path: string) =>
    http(app).get(path).auth(viewer.token, { type: 'bearer' });

  type Summary = { current: { workouts: number; calories: number } };

  it('counts only published workouts, with the default weight', async () => {
    const own = (await get(owner, STATS_ROUTES[0]).expect(200)).body as Summary;
    const seen = (
      await get(follower, `${STATS_ROUTES[0]}&userId=${owner.id}`).expect(200)
    ).body as Summary;

    expect(own.current.workouts).toBe(2);
    expect(seen.current.workouts).toBe(1);
    // Same workout at 70 kg instead of 100 kg.
    expect(seen.current.calories).toBeGreaterThan(0);
    expect(seen.current.calories).toBeLessThan(own.current.calories);

    const consistency = (
      await get(follower, `/stats/consistency?userId=${owner.id}`).expect(200)
    ).body as { totalWorkouts: number };

    expect(consistency.totalWorkouts).toBe(1);
  });

  it('answers every stats route for a follower of a private profile', async () => {
    for (const route of STATS_ROUTES) {
      const sep = route.includes('?') ? '&' : '?';

      await get(follower, `${route}${sep}userId=${owner.id}`).expect(200);
    }
  });

  it('hides the stats of a private profile from a stranger', async () => {
    for (const route of STATS_ROUTES) {
      const sep = route.includes('?') ? '&' : '?';

      await get(stranger, `${route}${sep}userId=${owner.id}`).expect(404);
      await get(
        stranger,
        `${route}${sep}userId=7f1c3a6e-2b4d-4c8e-9a0b-1d2e3f405162`,
      ).expect(404);
    }
    await get(stranger, '/stats/consistency?userId=nope').expect(400);
  });

  it('shows the join date on the profile, without private fields', async () => {
    const res = await get(stranger, `/users/${owner.id}/profile`).expect(200);
    const body = res.body as Record<string, unknown>;

    expect(new Date(body.createdAt as string).toString()).not.toBe(
      'Invalid Date',
    );
    for (const field of ['email', 'weight', 'gender', 'goal', 'password'])
      expect(body).not.toHaveProperty(field);
  });
});
