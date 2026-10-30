import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

describe('Workouts with decimal weights (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let bench: string;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    bench = await exerciseId(app, 'Bench Press (Barbell)');
    user = await createUser(app, 'decimal');
  });

  afterAll(() => app.close());

  const completed = (sets: Array<{ reps: number; weight: number }>) => ({
    title: 'Décimales',
    completionDate: new Date().toISOString(),
    totalDurationSeconds: 3600,
    exercises: [{ exerciseId: bench, sets }],
  });

  it('accepts 62.5 kg, reads it back, and computes volume and 1RM', async () => {
    const created = await http(app)
      .post('/workouts/completed')
      .auth(user.token, { type: 'bearer' })
      .send(
        completed([
          { reps: 7, weight: 62.5 },
          { reps: 5, weight: 65 },
        ]),
      )
      .expect(201);
    const id = (created.body as { id: string }).id;

    const read = await http(app)
      .get(`/workouts/completed/${id}`)
      .auth(user.token, { type: 'bearer' })
      .expect(200);
    const body = read.body as {
      workout: { exercises: Array<{ sets: Array<{ weight: number }> }> };
    };

    expect(body.workout.exercises[0].sets.map((s) => s.weight)).toEqual([
      62.5, 65,
    ]);

    const stats = await http(app)
      .get(`/stats/workout/${id}`)
      .auth(user.token, { type: 'bearer' })
      .expect(200);

    expect(stats.body).toMatchObject({ totalVolume: 762.5, totalReps: 12 });
    expect((stats.body as { exercises: object[] }).exercises[0]).toMatchObject({
      heaviestWeight: 65,
      estimatedOneRepMax: 77.08,
    });

    const exerciseStats = await http(app)
      .get(`/exercises/${bench}/stats`)
      .auth(user.token, { type: 'bearer' })
      .expect(200);

    expect(exerciseStats.body).toMatchObject({
      prWeight: 65,
      bestEstimatedOneRepMax: 77.08,
      totalVolume: 762.5,
    });
  });

  it('awards a record beaten by 2.5 kg', async () => {
    const res = await http(app)
      .post('/workouts/completed')
      .auth(user.token, { type: 'bearer' })
      .send(completed([{ reps: 5, weight: 67.5 }]))
      .expect(201);
    const badges = (
      res.body as {
        badges: Array<{ type: string; value: number; previousValue: number }>;
      }
    ).badges;

    expect(badges).toContainEqual(
      expect.objectContaining({
        type: 'heaviest_weight',
        value: 67.5,
        previousValue: 65,
      }),
    );
  });

  it('refuses more than two decimals', () =>
    http(app)
      .post('/workouts/completed')
      .auth(user.token, { type: 'bearer' })
      .send(completed([{ reps: 5, weight: 62.555 }]))
      .expect(400));

  it('accepts decimals in planned workouts too', async () => {
    const res = await http(app)
      .post('/workouts/planned')
      .auth(user.token, { type: 'bearer' })
      .send({
        title: 'Plan décimal',
        exercises: [{ exerciseId: bench, sets: [{ reps: 8, weight: 42.5 }] }],
      })
      .expect(201);
    const plan = res.body as {
      exercises: Array<{ sets: Array<{ weight: number }> }>;
    };

    expect(plan.exercises[0].sets[0].weight).toBe(42.5);
  });
});
