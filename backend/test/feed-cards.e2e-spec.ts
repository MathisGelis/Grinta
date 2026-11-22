import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

const NAMES = [
  'Bench Press (Barbell)',
  'Squat (Barbell)',
  'Deadlift (Barbell)',
  'Pull Up',
  'Overhead Press (Barbell)',
  'Bent Over Row (Barbell)',
];

type Card = Record<string, unknown> & {
  id: string;
  exercises: unknown[];
  stats: Record<string, unknown>;
};

// A feed card carries everything the post detail does, so that the app does
// not call GET /posts/:id once per card.
describe('Feed cards (e2e)', () => {
  let app: NestExpressApplication;
  let author: TestUser;
  let viewer: TestUser;
  const postIds: string[] = [];

  const get = async <T>(path: string) =>
    (
      await http(app)
        .get(path)
        .auth(viewer.token, { type: 'bearer' })
        .expect(200)
    ).body as T;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    [author, viewer] = await Promise.all([
      createUser(app, 'cardauthor'),
      createUser(app, 'cardviewer'),
    ]);
    const ids = await Promise.all(NAMES.map((n) => exerciseId(app, n)));

    for (let i = 0; i < 5; i++) {
      const workout = await http(app)
        .post('/workouts/completed')
        .auth(author.token, { type: 'bearer' })
        .send({
          title: `Séance ${i} avec un titre un peu long pour peser`,
          description:
            'Une description de séance, assez longue pour être réaliste.',
          completionDate: new Date().toISOString(),
          totalDurationSeconds: 3600 + i,
          exercises: ids.map((exerciseId) => ({
            exerciseId,
            sets: [1, 2, 3, 4].map((n) => ({
              reps: 6 + n,
              weight: 40 + i * 5,
            })),
          })),
        })
        .expect(201);
      const post = await http(app)
        .post('/posts')
        .auth(author.token, { type: 'bearer' })
        .send({ workoutId: (workout.body as { id: string }).id })
        .expect(201);

      postIds.push((post.body as { id: string }).id);
    }
    await app
      .get(DataSource)
      .query(
        'INSERT INTO connections ("followerId", "followingId") VALUES ($1, $2)',
        [viewer.id, author.id],
      );
  });

  afterAll(() => app.close());

  // The top feed holds every public account's best posts of the month, the
  // ones of other tests included: only the parity is checked there.
  it.each(['/posts/feed/following', '/posts/feed/top'])(
    '%s cards hold what the post detail holds',
    async (path) => {
      const cards = await get<Card[]>(`${path}?limit=5`);

      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        const detail = await get<Record<string, unknown>>(`/posts/${card.id}`);

        // Every field of the detail, with the same value.
        for (const [key, value] of Object.entries(detail))
          expect([key, card[key]]).toEqual([key, value]);
        expect(card.userId).toEqual(expect.any(String));
        expect(card.uniqueName).toEqual(expect.any(String));
        expect(card.totalExercises).toBe(card.exercises.length);
      }
    },
  );

  it('the following feed tells the author and the totals of each post', async () => {
    const cards = await get<Card[]>('/posts/feed/following?limit=5');

    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card.userId).toBe(author.id);
      expect(card.uniqueName).toBe(author.uniqueName);
      expect(card.totalExercises).toBe(NAMES.length);
      expect(card.stats).toMatchObject({ totalSets: NAMES.length * 4 });
    }
    // Five posts of six exercises weigh well under 10 KB: the list is enough
    // for the app, which no longer calls the detail of each card.
    expect(Buffer.byteLength(JSON.stringify(cards))).toBeLessThan(10_000);
  });
});
