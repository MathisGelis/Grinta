import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

type Body = Record<string, unknown>;
interface Failure {
  code: string;
  errors: Array<{ field: string; code: string }>;
}

describe('Workout validation (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let bench: string;
  let ip = 0;

  const send = (method: 'post' | 'patch', path: string, body: Body) =>
    http(app)
      [method](path)
      .auth(user.token, { type: 'bearer' })
      // The global limiter must not answer before the validation does.
      .set('X-Forwarded-For', `50.0.${Math.floor(ip / 250)}.${ip++ % 250}`)
      .send(body);

  const completed = (over: Body = {}) => ({
    title: 'Séance',
    completionDate: new Date().toISOString(),
    totalDurationSeconds: 3600,
    exercises: [{ exerciseId: bench, sets: [{ reps: 8, weight: 50 }] }],
    ...over,
  });
  const planned = (over: Body = {}) => ({
    title: 'Plan',
    exercises: [{ exerciseId: bench, sets: [{ reps: 8, weight: 50 }] }],
    ...over,
  });
  const withSets = (sets: unknown) => ({
    exercises: [{ exerciseId: bench, sets }],
  });
  const sets = (n: number) =>
    Array.from({ length: n }, () => ({ reps: 8, weight: 50 }));
  const hours = (h: number) =>
    new Date(Date.now() + h * 3_600_000).toISOString();

  async function refuses(
    path: string,
    body: Body,
    field: string,
    code: string,
    method: 'post' | 'patch' = 'post',
  ) {
    const res = await send(method, path, body);

    expect([field, res.status]).toEqual([field, 400]);
    const failure = res.body as Failure;

    expect(failure.code).toBe('VALIDATION_ERROR');
    expect(failure.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field, code })]),
    );
  }

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'wval');
    bench = await exerciseId(app, 'Bench Press (Barbell)');
  });

  afterAll(() => app.close());

  describe('completed workouts', () => {
    const path = '/workouts/completed';

    it('refuses absurd values', async () => {
      await refuses(
        path,
        completed(withSets([{ reps: 100_000, weight: 50 }])),
        'exercises.0.sets.0.reps',
        'VALUE_TOO_LARGE',
      );
      await refuses(
        path,
        completed(withSets([])),
        'exercises.0.sets',
        'ARRAY_TOO_SHORT',
      );
      await refuses(
        path,
        completed(withSets(sets(31))),
        'exercises.0.sets',
        'ARRAY_TOO_LONG',
      );
      await refuses(
        path,
        completed({ title: 'x'.repeat(5000) }),
        'title',
        'FIELD_TOO_LONG',
      );
      await refuses(path, completed({ title: '' }), 'title', 'FIELD_TOO_SHORT');
      await refuses(
        path,
        completed({ description: 'x'.repeat(1001) }),
        'description',
        'FIELD_TOO_LONG',
      );
      await refuses(
        path,
        completed({ totalDurationSeconds: -5 }),
        'totalDurationSeconds',
        'VALUE_TOO_SMALL',
      );
      await refuses(
        path,
        completed({ totalDurationSeconds: 0 }),
        'totalDurationSeconds',
        'VALUE_TOO_SMALL',
      );
      await refuses(
        path,
        completed({ totalDurationSeconds: 315_360_000 }),
        'totalDurationSeconds',
        'VALUE_TOO_LARGE',
      );
      await refuses(
        path,
        completed({ exercises: [] }),
        'exercises',
        'ARRAY_TOO_SHORT',
      );
      await refuses(
        path,
        completed({
          exercises: Array.from({ length: 41 }, () => ({
            exerciseId: bench,
            sets: sets(1),
          })),
        }),
        'exercises',
        'ARRAY_TOO_LONG',
      );
      await refuses(
        path,
        completed({
          exercises: [{ exerciseId: bench, sets: sets(1), timerSeconds: 3601 }],
        }),
        'exercises.0.timerSeconds',
        'VALUE_TOO_LARGE',
      );
      await refuses(
        path,
        completed({
          exercises: [{ exerciseId: bench, sets: sets(1), timerSeconds: -1 }],
        }),
        'exercises.0.timerSeconds',
        'VALUE_TOO_SMALL',
      );
      await refuses(
        path,
        completed({ completionDate: hours(25) }),
        'completionDate',
        'DATE_TOO_FAR_IN_FUTURE',
      );
    });

    it('accepts the limits', async () => {
      await send(
        'post',
        path,
        completed({
          title: 'x'.repeat(100),
          description: 'y'.repeat(1000),
          totalDurationSeconds: 86_400,
          completionDate: hours(23),
          exercises: Array.from({ length: 40 }, () => ({
            exerciseId: bench,
            timerSeconds: 3600,
            sets: sets(30).map((s) => ({ ...s, reps: 1000, weight: 1000 })),
          })),
        }),
      ).expect(201);
      await send(
        'post',
        path,
        completed({
          title: 'a',
          description: '',
          totalDurationSeconds: 1,
          exercises: [
            {
              exerciseId: bench,
              timerSeconds: 0,
              sets: [{ reps: 1, weight: 0 }],
            },
          ],
        }),
      ).expect(201);
    });

    it('applies the same limits to an update', async () => {
      const created = (await send('post', path, completed()).expect(201))
        .body as { id: string };
      const target = `${path}/${created.id}`;

      await refuses(
        target,
        { totalDurationSeconds: 315_360_000 },
        'totalDurationSeconds',
        'VALUE_TOO_LARGE',
        'patch',
      );
      await refuses(
        target,
        { title: 'x'.repeat(101) },
        'title',
        'FIELD_TOO_LONG',
        'patch',
      );
      await refuses(
        target,
        withSets([]),
        'exercises.0.sets',
        'ARRAY_TOO_SHORT',
        'patch',
      );
      await refuses(
        target,
        { completionDate: hours(48) },
        'completionDate',
        'DATE_TOO_FAR_IN_FUTURE',
        'patch',
      );
      await send('patch', target, { title: 'Renommée' }).expect(200);
    });
  });

  describe('planned workouts', () => {
    const path = '/workouts/planned';

    it('refuses absurd values', async () => {
      await refuses(
        path,
        planned(withSets([{ reps: 1001, weight: 0 }])),
        'exercises.0.sets.0.reps',
        'VALUE_TOO_LARGE',
      );
      await refuses(
        path,
        planned(withSets([])),
        'exercises.0.sets',
        'ARRAY_TOO_SHORT',
      );
      await refuses(
        path,
        planned(withSets(sets(31))),
        'exercises.0.sets',
        'ARRAY_TOO_LONG',
      );
      await refuses(
        path,
        planned({ exercises: [] }),
        'exercises',
        'ARRAY_TOO_SHORT',
      );
      await refuses(
        path,
        planned({ title: 'x'.repeat(101) }),
        'title',
        'FIELD_TOO_LONG',
      );
      await refuses(
        path,
        planned({ description: 'x'.repeat(1001) }),
        'description',
        'FIELD_TOO_LONG',
      );
      await refuses(
        path,
        planned({
          exercises: [{ exerciseId: bench, plannedRestSeconds: 99_999 }],
        }),
        'exercises.0.plannedRestSeconds',
        'VALUE_TOO_LARGE',
      );
    });

    it('accepts the limits, and an exercise without sets', async () => {
      await send(
        'post',
        path,
        planned({
          title: 'x'.repeat(100),
          description: 'y'.repeat(1000),
          exercises: Array.from({ length: 40 }, () => ({
            exerciseId: bench,
            sets: sets(30),
            plannedRestSeconds: 3600,
          })),
        }),
      ).expect(201);
      await send(
        'post',
        path,
        planned({ exercises: [{ exerciseId: bench }] }),
      ).expect(201);
    });

    it('applies the same limits to an update', async () => {
      const created = (await send('post', path, planned()).expect(201))
        .body as {
        id: string;
      };

      await refuses(
        `${path}/${created.id}`,
        { title: 'x'.repeat(101) },
        'title',
        'FIELD_TOO_LONG',
        'patch',
      );
      await refuses(
        `${path}/${created.id}`,
        withSets(sets(31)),
        'exercises.0.sets',
        'ARRAY_TOO_LONG',
        'patch',
      );
    });
  });
});
