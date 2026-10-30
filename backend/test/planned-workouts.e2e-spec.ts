import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

type PlannedRow = {
  id: string;
  totalExercises: number;
  totalSets: number;
  estimatedDurationMinutes: number | null;
};

describe('Planned workouts summary (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let squat: string;
  let bench: string;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'planned');
    squat = await exerciseId(app, 'Squat (Barbell)');
    bench = await exerciseId(app, 'Bench Press (Barbell)');
  });

  afterAll(() => app.close());

  const list = async () =>
    (
      await http(app)
        .get('/workouts/planned')
        .auth(user.token, { type: 'bearer' })
        .expect(200)
    ).body as PlannedRow[];

  it('lists totalSets and estimatedDurationMinutes', async () => {
    const set = { reps: 8, weight: 60 };
    const withPlan = await http(app)
      .post('/workouts/planned')
      .auth(user.token, { type: 'bearer' })
      .send({
        title: 'Full',
        estimatedDurationMinutes: 45,
        exercises: [
          { exerciseId: squat, sets: [set, set, set] },
          { exerciseId: bench, sets: [set, set, set, set] },
        ],
      })
      .expect(201);
    const bare = await http(app)
      .post('/workouts/planned')
      .auth(user.token, { type: 'bearer' })
      .send({ title: 'Sans séries', exercises: [{ exerciseId: squat }] })
      .expect(201);
    const rows = await list();
    const byId = (id: string) => rows.find((r) => r.id === id);

    expect(byId((withPlan.body as { id: string }).id)).toMatchObject({
      totalExercises: 2,
      totalSets: 7,
      estimatedDurationMinutes: 45,
    });
    expect(byId((bare.body as { id: string }).id)).toMatchObject({
      totalExercises: 1,
      totalSets: 0,
      estimatedDurationMinutes: null,
    });
  });

  it('edits and clears the duration, within 1 to 600', async () => {
    const created = await http(app)
      .post('/workouts/planned')
      .auth(user.token, { type: 'bearer' })
      .send({ title: 'Edit', exercises: [{ exerciseId: squat }] })
      .expect(201);
    const id = (created.body as { id: string }).id;
    const patch = (body: object) =>
      http(app)
        .patch(`/workouts/planned/${id}`)
        .auth(user.token, { type: 'bearer' })
        .send(body);

    await patch({ estimatedDurationMinutes: 60 }).expect(200);
    expect(
      (await list()).find((r) => r.id === id)?.estimatedDurationMinutes,
    ).toBe(60);
    await patch({ estimatedDurationMinutes: null }).expect(200);
    expect(
      (await list()).find((r) => r.id === id)?.estimatedDurationMinutes,
    ).toBeNull();

    const tooLong = await patch({ estimatedDurationMinutes: 601 }).expect(400);

    expect(tooLong.body).toMatchObject({
      errors: [{ field: 'estimatedDurationMinutes', code: 'VALUE_TOO_LARGE' }],
    });
    await patch({ estimatedDurationMinutes: 0 }).expect(400);
    await patch({ estimatedDurationMinutes: 30.5 }).expect(400);
  });
});
