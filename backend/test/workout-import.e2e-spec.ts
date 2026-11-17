import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  http,
  TestUser,
} from './e2e-utils';

interface Draft {
  workouts: Array<{
    title: string;
    exercises: Array<{
      exerciseId: string;
      name: string;
      sets: Array<{ reps: number; weight: number }>;
      plannedRestSeconds: number | null;
    }>;
  }>;
  programme: null | {
    days: Array<{ dayNumber: number; workoutIndex: number | null }>;
  };
  unrecognized: Array<{ line: number; text: string }>;
}

describe('Workout import from notes (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'importer');
  });

  afterAll(() => app.close());

  const send = (body: object) =>
    http(app)
      .post('/workouts/import')
      .auth(user.token, { type: 'bearer' })
      .send(body);

  it('reads the notes into a draft the app can save as is', async () => {
    const draft = (
      await send({ text: 'dc 45x8\ntractions 3x10\nzzz 3x10' }).expect(200)
    ).body as Draft;

    expect(draft.programme).toBeNull();
    expect(draft.unrecognized).toEqual([
      expect.objectContaining({ line: 3, text: 'zzz 3x10' }),
    ]);
    const [bench, pullUp] = draft.workouts[0].exercises;

    expect(bench).toMatchObject({
      name: 'Bench Press (Barbell)',
      sets: [{ reps: 8, weight: 45 }],
    });
    expect(pullUp.sets).toHaveLength(3);

    // Nothing was saved, and the draft fits POST /workouts/planned.
    const before = await http(app)
      .get('/workouts/planned')
      .auth(user.token, { type: 'bearer' })
      .expect(200);

    expect(JSON.stringify(before.body)).not.toContain(bench.exerciseId);
    await http(app)
      .post('/workouts/planned')
      .auth(user.token, { type: 'bearer' })
      .send({
        title: draft.workouts[0].title,
        exercises: draft.workouts[0].exercises.map((e) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
        })),
      })
      .expect(201);
  });

  it('makes a programme when the notes have days', async () => {
    const draft = (
      await send({
        text: 'Lundi : Push\ndc 4x8 60kg\nMercredi : Pull\ntractions 4x6',
      }).expect(200)
    ).body as Draft;

    expect(draft.workouts.map((w) => w.title)).toEqual(['Push', 'Pull']);
    expect(draft.programme!.days).toHaveLength(7);
    expect(draft.programme!.days[2]).toMatchObject({
      dayNumber: 3,
      workoutIndex: 1,
    });
  });

  it('refuses an empty or oversized text', async () => {
    await send({ text: '' }).expect(400);
    await send({}).expect(400);
    await send({ text: 'a'.repeat(10_001) }).expect(400);
  });
});
