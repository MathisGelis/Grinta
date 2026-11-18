import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

interface Today {
  status: string;
  startedOn: string;
  startDay: number;
  dayNumber: number | null;
  cycle: number | null;
  workout: { id: string } | null;
}

const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

describe('Start a programme on any day, and end it (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let other: TestUser;
  let programmeId: string;
  let workoutIds: string[];

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    [user, other] = await Promise.all([
      createUser(app, 'progstart'),
      createUser(app, 'progother'),
    ]);
    const bench = await exerciseId(app, 'Bench Press (Barbell)');

    workoutIds = [];
    for (const title of ['A', 'B', 'C']) {
      const res = await as(user)
        .post('/workouts/planned')
        .send({ title, exercises: [{ exerciseId: bench }] })
        .expect(201);

      workoutIds.push((res.body as { id: string }).id);
    }
    // Day 1: A, day 2: rest, day 3: B, day 4: C.
    const res = await as(user)
      .post('/programmes')
      .send({
        weekNumber: 1,
        difficulty: 'BEGINNER',
        locationType: 'GYM',
        title: '4 jours',
        days: [
          { dayNumber: 1, workoutId: workoutIds[0] },
          { dayNumber: 2 },
          { dayNumber: 3, workoutId: workoutIds[1] },
          { dayNumber: 4, workoutId: workoutIds[2] },
        ],
      })
      .expect(201);

    programmeId = (res.body as { id: string }).id;
  });

  afterAll(() => app.close());

  function as(u: TestUser) {
    return {
      get: (path: string) =>
        http(app).get(path).auth(u.token, { type: 'bearer' }),
      post: (path: string) =>
        http(app).post(path).auth(u.token, { type: 'bearer' }),
      delete: (path: string) =>
        http(app).delete(path).auth(u.token, { type: 'bearer' }),
    };
  }

  it('starts on the chosen day and continues from there', async () => {
    // Within a week of today, the window a programme may start in.
    const start = addDays(new Date().toISOString().slice(0, 10), -2);
    const started = (
      await as(user)
        .post(`/programmes/${programmeId}/start`)
        .send({ startDate: start, startDay: 3 })
        .expect(201)
    ).body as Today;

    expect(started).toMatchObject({
      status: 'workout',
      startedOn: start,
      startDay: 3,
      dayNumber: 3,
      cycle: 1,
    });
    expect(started.workout!.id).toBe(workoutIds[1]);

    const day = async (offset: number) =>
      (
        await as(user)
          .get(`/programmes/active/today?date=${addDays(start, offset)}`)
          .expect(200)
      ).body as Today;

    expect(await day(1)).toMatchObject({ dayNumber: 4, cycle: 1 });
    expect((await day(1)).workout!.id).toBe(workoutIds[2]);
    expect(await day(2)).toMatchObject({ dayNumber: 1, cycle: 2 });
    expect(await day(3)).toMatchObject({ dayNumber: 2, status: 'rest' });
    expect(await day(-1)).toMatchObject({ status: 'not_started' });
  });

  it('starts on day 1 by default', async () => {
    const res = await as(user)
      .post(`/programmes/${programmeId}/start`)
      .send({ startDate: addDays(new Date().toISOString().slice(0, 10), -2) })
      .expect(201);

    expect(res.body).toMatchObject({ startDay: 1, dayNumber: 1 });
  });

  it('refuses a start day outside the programme', async () => {
    const res = await as(user)
      .post(`/programmes/${programmeId}/start`)
      .send({ startDay: 5 })
      .expect(400);

    expect(res.body).toMatchObject({
      code: 'START_DAY_OUT_OF_RANGE',
      cycleLength: 4,
    });
    await as(user)
      .post(`/programmes/${programmeId}/start`)
      .send({ startDay: 0 })
      .expect(400);
    await as(user)
      .post(`/programmes/${programmeId}/start`)
      .send({ startDay: 'deux' })
      .expect(400);
  });

  it('ends the current programme and keeps it', async () => {
    await as(user)
      .post(`/programmes/${programmeId}/start`)
      .send({})
      .expect(201);
    await as(other).delete('/programmes/active').expect(404);
    await as(user).delete('/programmes/active').expect(204);
    await as(user).get('/programmes/active/today').expect(404);
    await as(user).delete('/programmes/active').expect(404);
    // The programme itself is still there and can be started again.
    await as(user).get(`/programmes/${programmeId}`).expect(200);
    await as(user)
      .post(`/programmes/${programmeId}/start`)
      .send({})
      .expect(201);
  });
});
