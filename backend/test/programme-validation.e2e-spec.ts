import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

interface Failure {
  code: string;
  errors?: Array<{ field: string; code: string }>;
}

const addDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

describe('Programme limits (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let workoutId: string;
  let programmeId: string;

  const as = () => ({
    post: (path: string) =>
      http(app).post(path).auth(user.token, { type: 'bearer' }),
    patch: (path: string) =>
      http(app).patch(path).auth(user.token, { type: 'bearer' }),
    get: (path: string) =>
      http(app).get(path).auth(user.token, { type: 'bearer' }),
  });
  const programme = (
    days: Array<{ dayNumber: number; workoutId?: string }>,
  ) => ({
    weekNumber: 1,
    difficulty: 'BEGINNER',
    locationType: 'GYM',
    title: 'Programme',
    days,
  });
  const numbered = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      dayNumber: i + 1,
      ...(i % 2 === 0 && { workoutId }),
    }));

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'proglimit');
    const bench = await exerciseId(app, 'Bench Press (Barbell)');

    workoutId = (
      (
        await as()
          .post('/workouts/planned')
          .send({ title: 'A', exercises: [{ exerciseId: bench }] })
          .expect(201)
      ).body as { id: string }
    ).id;
    programmeId = (
      (
        await as()
          .post('/programmes')
          .send(programme(numbered(4)))
          .expect(201)
      ).body as { id: string }
    ).id;
  });

  afterAll(() => app.close());

  describe('days', () => {
    it('refuses duplicated day numbers instead of a 500', async () => {
      const res = await as()
        .post('/programmes')
        .send(programme([{ dayNumber: 1, workoutId }, { dayNumber: 1 }]))
        .expect(400);

      expect(res.body).toMatchObject({ code: 'DAY_NUMBER_DUPLICATE' });
    });

    it('refuses day numbers that skip a day', async () => {
      const res = await as()
        .post('/programmes')
        .send(programme([{ dayNumber: 1, workoutId }, { dayNumber: 3 }]))
        .expect(400);

      expect(res.body).toMatchObject({ code: 'DAY_NUMBERS_NOT_CONSECUTIVE' });
      await as()
        .post('/programmes')
        .send(programme([{ dayNumber: 2, workoutId }]))
        .expect(400);
    });

    it('takes the days in any order, as long as they are 1 to N', async () => {
      await as()
        .post('/programmes')
        .send(
          programme([
            { dayNumber: 3 },
            { dayNumber: 1, workoutId },
            { dayNumber: 2 },
          ]),
        )
        .expect(201);
    });

    it('allows 84 days and no more', async () => {
      await as()
        .post('/programmes')
        .send(programme(numbered(84)))
        .expect(201);
      const res = await as()
        .post('/programmes')
        .send(programme(numbered(85)))
        .expect(400);

      expect((res.body as Failure).errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'days', code: 'ARRAY_TOO_LONG' }),
        ]),
      );
      const huge = await as()
        .post('/programmes')
        .send(programme([{ dayNumber: 500 }]))
        .expect(400);

      expect((huge.body as Failure).errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'days.0.dayNumber',
            code: 'VALUE_TOO_LARGE',
          }),
        ]),
      );
    });

    it('applies the same rules when updating', async () => {
      const res = await as()
        .patch(`/programmes/${programmeId}`)
        .send({ days: [{ dayNumber: 1 }, { dayNumber: 1 }] })
        .expect(400);

      expect(res.body).toMatchObject({ code: 'DAY_NUMBER_DUPLICATE' });
      await as()
        .patch(`/programmes/${programmeId}`)
        .send({ days: numbered(85) })
        .expect(400);
      await as()
        .patch(`/programmes/${programmeId}`)
        .send({ days: numbered(5) })
        .expect(200);
    });
  });

  describe('start date', () => {
    const start = (startDate: string) =>
      as().post(`/programmes/${programmeId}/start`).send({ startDate });

    it('refuses a start far from today', async () => {
      for (const date of [
        '2099-01-01',
        addDays(8),
        addDays(-8),
        '1999-01-01',
      ]) {
        const res = await start(date);

        expect([date, res.status]).toEqual([date, 400]);
        expect(res.body).toMatchObject({ code: 'START_DATE_OUT_OF_RANGE' });
      }
    });

    it('accepts a week around today', async () => {
      await start(addDays(-7)).expect(201);
      await start(addDays(7)).expect(201);
      await start(addDays(0)).expect(201);
    });

    it('says the programme has not started when it starts later', async () => {
      await start(addDays(3)).expect(201);
      const today = (await as().get('/programmes/active/today').expect(200))
        .body as { status: string; daysUntilStart: number; workout: unknown };

      expect(today).toMatchObject({
        status: 'not_started',
        daysUntilStart: 3,
        workout: null,
      });
    });
  });
});
