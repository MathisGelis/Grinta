import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  http,
  TestUser,
} from './e2e-utils';

interface Item {
  exerciseId: string;
  lastPerformedAt: string;
}

describe('GET /exercises/stats pages (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let exercises: string[];

  const get = (query: string) =>
    http(app)
      .get(`/exercises/stats${query}`)
      .auth(user.token, { type: 'bearer' });

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'statpages');
    exercises = (
      await app
        .get(DataSource)
        .query<Array<{ id: string }>>(`SELECT id FROM exercises LIMIT 5`)
    ).map((row) => row.id);
    // One workout a day on each of the five exercises, the last one newest.
    for (const [i, exerciseId] of exercises.entries())
      await http(app)
        .post('/workouts/completed')
        .auth(user.token, { type: 'bearer' })
        .send({
          title: `Day ${i}`,
          completionDate: new Date(
            Date.now() - (exercises.length - i) * 86_400_000,
          ).toISOString(),
          totalDurationSeconds: 1800,
          exercises: [{ exerciseId, sets: [{ reps: 5, weight: 40 }] }],
        })
        .expect(201);
  });

  afterAll(() => app.close());

  it('keeps the whole array without parameters', async () => {
    const res = await get('').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as Item[]).length).toBe(5);
  });

  it('pages newest first until nextBefore is null, without gaps or repeats', async () => {
    const seen: string[] = [];
    let before: string | undefined;
    let pages = 0;

    do {
      const res = await get(
        `?limit=2${before ? `&before=${before}` : ''}`,
      ).expect(200);
      const body = res.body as { items: Item[]; nextBefore: string | null };

      expect(body.items.length).toBeLessThanOrEqual(2);
      seen.push(...body.items.map((item) => item.exerciseId));
      before = body.nextBefore ?? undefined;
      pages++;
    } while (before);

    expect(pages).toBe(3);
    expect(new Set(seen).size).toBe(5);
    expect(seen).toEqual([...exercises].reverse());
  });

  it('caps limit at 100 and refuses a forged cursor', async () => {
    const res = await get('?limit=100000').expect(200);

    expect((res.body as { items: Item[] }).items.length).toBe(5);
    const bad = await get('?limit=2&before=nonsense').expect(400);

    expect(bad.body.code).toBe('CURSOR_INVALID');
  });
});
