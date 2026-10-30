import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

describe('Calories everywhere the same (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'calories');
    await http(app)
      .patch(`/users/${user.id}`)
      .auth(user.token, { type: 'bearer' })
      .send({ weight: 82 })
      .expect(200);
  });

  afterAll(() => app.close());

  it('lists, details and the heatmap give the same calories', async () => {
    const date = new Date();
    const ids: string[] = [];

    for (const [name, minutes] of [
      ['Squat (Barbell)', 50],
      ['Push Up', 20],
    ] as const) {
      const res = await http(app)
        .post('/workouts/completed')
        .auth(user.token, { type: 'bearer' })
        .send({
          title: name,
          completionDate: date.toISOString(),
          totalDurationSeconds: minutes * 60,
          exercises: [
            {
              exerciseId: await exerciseId(app, name),
              sets: [{ reps: 10, weight: name === 'Push Up' ? 0 : 80 }],
            },
          ],
        })
        .expect(201);

      ids.push((res.body as { id: string }).id);
    }

    const list = (
      await http(app)
        .get('/workouts/completed')
        .auth(user.token, { type: 'bearer' })
        .expect(200)
    ).body as Array<{ id: string; calories: number }>;
    let total = 0;

    for (const id of ids) {
      const detail = await http(app)
        .get(`/stats/workout/${id}`)
        .auth(user.token, { type: 'bearer' })
        .expect(200);
      const expected = (detail.body as { estimatedCalories: number })
        .estimatedCalories;

      expect(expected).toBeGreaterThan(0);
      expect(list.find((w) => w.id === id)?.calories).toBe(expected);
      total += expected;
    }

    const heatmap = (
      await http(app)
        .get(`/stats/heatmap?year=${date.getFullYear()}`)
        .auth(user.token, { type: 'bearer' })
        .expect(200)
    ).body as {
      totalCalories: number;
      days: Array<{ workouts: number; calories: number }>;
    };

    expect(heatmap.days).toHaveLength(1);
    expect(heatmap.days[0].calories).toBeCloseTo(total, 2);
    expect(heatmap.totalCalories).toBeCloseTo(total, 2);
  });
});
