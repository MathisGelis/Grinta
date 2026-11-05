import { Client } from 'pg';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

const NAMES = [
  'Squat (Barbell)',
  'Bench Press (Barbell)',
  'Deadlift (Barbell)',
  'Pull Up',
  'Overhead Press (Barbell)',
  'Bent Over Row (Barbell)',
  'Lat Pulldown (Cable)',
  'Leg Press (Machine)',
];

interface WorkoutBody {
  exercises: Array<{ exercise: { name: string } }>;
}

async function setJoins(value: 'on' | 'off') {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();
  const db = await client.query<{ db: string }>(
    'SELECT current_database() AS db',
  );
  const name = db.rows[0].db;

  for (const setting of ['enable_nestloop', 'enable_mergejoin'])
    await client.query(
      value === 'off'
        ? `ALTER DATABASE "${name}" SET ${setting} = off`
        : `ALTER DATABASE "${name}" RESET ${setting}`,
    );
  await client.end();
}

// The exercises of the day must come in the order of the plan, as on
// GET /workouts/planned/:id, not in the order of a database join.
describe("Today's programme workout keeps the plan order (e2e)", () => {
  let app: NestExpressApplication;
  let user: TestUser;

  beforeAll(async () => {
    // On a small database Postgres joins in physical order, which hides the
    // problem. With a hash join, as on a bigger production table, rows come
    // back in another order: forced here so the test cannot pass by luck.
    await setJoins('off');
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'today');
  });

  afterAll(async () => {
    await app.close();
    await setJoins('on');
  });

  const as = () => ({
    get: (path: string) =>
      http(app).get(path).auth(user.token, { type: 'bearer' }),
    post: (path: string, body: object = {}) =>
      http(app).post(path).auth(user.token, { type: 'bearer' }).send(body),
  });

  it('lists the exercises in the planned order', async () => {
    const names = (order: number[]) => order.map((i) => NAMES[i]);
    const plans = [
      [7, 0, 6, 1, 5, 2, 4, 3],
      [3, 4, 2, 5, 1, 6, 0, 7],
    ];
    const workoutIds: string[] = [];

    for (const order of plans) {
      const exercises: Array<{ exerciseId: string; sets: object[] }> = [];

      for (const name of names(order))
        exercises.push({
          exerciseId: await exerciseId(app, name),
          sets: [{ reps: 8, weight: 0 }],
        });
      const res = await as()
        .post('/workouts/planned', { title: 'Plan', exercises })
        .expect(201);

      workoutIds.push((res.body as { id: string }).id);
    }
    const programme = await as()
      .post('/programmes', {
        weekNumber: 1,
        difficulty: 'BEGINNER',
        locationType: 'GYM',
        title: 'Ordre',
        days: [
          { dayNumber: 1, workoutId: workoutIds[0] },
          { dayNumber: 2, workoutId: workoutIds[1] },
        ],
      })
      .expect(201);
    const id = (programme.body as { id: string }).id;
    const today = new Date();
    const yesterday = new Date(+today - 86_400_000).toISOString().slice(0, 10);

    for (const [startedOn, plan] of [
      [today.toISOString().slice(0, 10), 0],
      [yesterday, 1],
    ] as const) {
      const started = await as()
        .post(`/programmes/${id}/start`, { startDate: startedOn })
        .expect(201);
      const fromStart = (started.body as { workout: WorkoutBody }).workout;
      const res = await as().get('/programmes/active/today').expect(200);
      const workout = (res.body as { workout: WorkoutBody }).workout;
      const detail = (
        await as().get(`/workouts/planned/${workoutIds[plan]}`).expect(200)
      ).body as { workout: WorkoutBody };

      expect(workout.exercises.map((e) => e.exercise.name)).toEqual(
        names(plans[plan]),
      );
      // The start answers with what the start date holds: day 1.
      expect(fromStart.exercises.map((e) => e.exercise.name)).toEqual(
        names(plans[0]),
      );
      expect(detail.workout.exercises.map((e) => e.exercise.name)).toEqual(
        names(plans[plan]),
      );
    }
  });
});
