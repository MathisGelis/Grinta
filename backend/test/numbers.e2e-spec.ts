import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createPost,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

// One workout, read from every route that shows its figures: they must
// agree, with the rounding rules of common/utils/numbers.
describe('Same numbers on every route (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let bench: string;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'numbers');
    bench = await exerciseId(app, 'Bench Press (Barbell)');
    await http(app)
      .patch(`/users/${user.id}`)
      .auth(user.token, { type: 'bearer' })
      .send({ weight: 77.5 })
      .expect(200);
  });

  afterAll(() => app.close());

  const get = async <T>(path: string) =>
    (await http(app).get(path).auth(user.token, { type: 'bearer' }).expect(200))
      .body as T;

  it('agrees on calories, volume and 1RM', async () => {
    const postId = await createPost(app, user, bench);
    const post = await get<{ workoutId: string }>(`/posts/${postId}`);
    const workoutId = post.workoutId;
    const detail = await get<{
      estimatedCalories: number;
      totalVolume: number;
      exercises: Array<{ estimatedOneRepMax: number }>;
    }>(`/stats/workout/${workoutId}`);
    const list = await get<Array<{ id: string; calories: number }>>(
      '/workouts/completed',
    );
    const throughPost = await get<{
      stats: { estimatedCalories: number; totalVolume: number };
    }>(`/posts/${postId}/workout`);
    const feed =
      await get<Array<{ id: string; stats: { totalVolume: number } }>>(
        '/posts/mine',
      );
    const exerciseStats = await get<{ bestEstimatedOneRepMax: number }>(
      `/exercises/${bench}/stats`,
    );
    const records = await get<{
      exercises: Array<{
        exerciseId: string;
        estimatedOneRepMax: { value: number };
      }>;
    }>('/stats/records');
    const summary = await get<{
      current: { calories: number; volume: number };
    }>('/stats/summary?period=week');

    // 8 x 50 kg: volume 400, 1RM 50 x (1 + 8/30) = 63.33 -> 63.3.
    expect(detail.totalVolume).toBe(400);
    expect(detail.exercises[0].estimatedOneRepMax).toBe(63.3);
    expect(Number.isInteger(detail.estimatedCalories)).toBe(true);

    expect(list.find((w) => w.id === workoutId)?.calories).toBe(
      detail.estimatedCalories,
    );
    expect(throughPost.stats).toMatchObject({
      estimatedCalories: detail.estimatedCalories,
      totalVolume: 400,
    });
    expect(feed.find((p) => p.id === postId)?.stats.totalVolume).toBe(400);
    expect(exerciseStats.bestEstimatedOneRepMax).toBe(63.3);
    expect(
      records.exercises.find((e) => e.exerciseId === bench)?.estimatedOneRepMax
        .value,
    ).toBe(63.3);
    expect(summary.current).toMatchObject({
      calories: detail.estimatedCalories,
      volume: 400,
    });
  });
});
