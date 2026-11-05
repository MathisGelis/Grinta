import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  http,
  TestUser,
} from './e2e-utils';

interface TemplateList {
  criteria: Record<string, unknown>;
  templates: Array<{
    key: string;
    recommended: boolean;
    workouts: Array<{ exercises: Array<{ exerciseId: string; name: string }> }>;
  }>;
}

interface Programme {
  id: string;
  title: string;
  difficulty: string;
  locationType: string;
  days: Array<{
    dayNumber: number;
    workout: null | {
      id: string;
      title: string;
      exercises: Array<{
        exercise: { name: string };
        sets: Array<{ reps: number; weight: number }>;
        plannedRestSeconds: number;
      }>;
    };
  }>;
}

describe('Onboarding answers and workout templates (e2e)', () => {
  let app: NestExpressApplication;
  let me: TestUser;
  let other: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    me = await createUser(app, 'tpl');
    other = await createUser(app, 'tplviewer');
  });

  afterAll(() => app.close());

  const as = (user: TestUser) => ({
    get: (path: string) =>
      http(app).get(path).auth(user.token, { type: 'bearer' }),
    post: (path: string) =>
      http(app).post(path).auth(user.token, { type: 'bearer' }),
    patch: (path: string, body: object) =>
      http(app).patch(path).auth(user.token, { type: 'bearer' }).send(body),
  });

  it('stores the onboarding answers, private to their owner', async () => {
    const answers = {
      goal: 'gain_weight',
      level: 'intermediate',
      trainingDaysPerWeek: 4,
      trainingLocation: 'gym',
    };

    await as(me).patch(`/users/${me.id}`, answers).expect(200);
    const own = await as(me).get(`/users/${me.id}`).expect(200);

    expect(own.body).toMatchObject(answers);
    const seen = await as(other).get(`/users/${me.id}`).expect(200);

    for (const field of ['level', 'trainingDaysPerWeek', 'trainingLocation'])
      expect(seen.body).not.toHaveProperty(field);
  });

  it('refuses out-of-range answers', async () => {
    const res = await as(me)
      .patch(`/users/${me.id}`, {
        level: 'pro',
        trainingDaysPerWeek: 8,
        trainingLocation: 'beach',
      })
      .expect(400);
    const fields = (
      res.body as { errors: Array<{ field: string }> }
    ).errors.map((e) => e.field);

    expect(fields).toEqual(
      expect.arrayContaining([
        'level',
        'trainingDaysPerWeek',
        'trainingLocation',
      ]),
    );
  });

  it('recommends from the profile, and the query overrides it', async () => {
    const fromProfile = (await as(me).get('/workouts/templates').expect(200))
      .body as TemplateList;

    expect(fromProfile.criteria).toEqual({
      goal: 'gain_weight',
      level: 'intermediate',
      daysPerWeek: 4,
      location: 'gym',
    });
    expect(fromProfile.templates[0]).toMatchObject({
      key: 'upper-lower-4',
      recommended: true,
    });
    for (const template of fromProfile.templates)
      for (const workout of template.workouts)
        expect(workout.exercises.length).toBeGreaterThan(0);

    const overridden = (
      await as(me)
        .get('/workouts/templates?goal=flexibility&location=home&daysPerWeek=3')
        .expect(200)
    ).body as TemplateList;

    expect(overridden.templates[0].key).toBe('mobility-3');
    await as(me).get('/workouts/templates?daysPerWeek=9').expect(400);
  });

  it('copies a template into planned workouts and a programme, not started', async () => {
    const res = await as(me).post('/workouts/templates/ppl-6/use').expect(201);
    const programme = res.body as Programme;

    expect(programme).toMatchObject({
      title: 'Push Pull Legs',
      difficulty: 'INTERMEDIATE',
      locationType: 'GYM',
    });
    expect(programme.days.map((d) => d.dayNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(programme.days[6].workout).toBeNull();
    // Push on Monday and Thursday is the same planned workout.
    expect(programme.days[0].workout!.id).toBe(programme.days[3].workout!.id);

    const push = programme.days[0].workout!;

    expect(push.exercises.map((e) => e.exercise.name)).toEqual([
      'Bench Press (Barbell)',
      'Bench Press (Incline, Dumbbell)',
      'Overhead Press (Barbell)',
      'Lateral Raise (Standing, Dumbbell)',
      'Triceps Pushdown (Rope)',
      'Chest Dip (Bodyweight)',
    ]);
    expect(push.exercises[0]).toMatchObject({
      sets: [
        { reps: 6, weight: 0 },
        { reps: 6, weight: 0 },
        { reps: 6, weight: 0 },
        { reps: 6, weight: 0 },
      ],
      plannedRestSeconds: 150,
    });

    const planned = (await as(me).get('/workouts/planned').expect(200))
      .body as unknown;

    expect(JSON.stringify(planned)).toContain(push.id);
    await as(me).get('/programmes/active/today').expect(404);
    await as(me).get(`/programmes/${programme.id}`).expect(200);
    await as(other).get(`/programmes/${programme.id}`).expect(404);
  });

  it('answers 404 for an unknown template', () =>
    as(me).post('/workouts/templates/nope/use').expect(404));
});
