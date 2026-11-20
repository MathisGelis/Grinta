import { extractMentions } from '../posts/utils/mentions';
import { buildExerciseStats } from '../exercise/utils/exercise-history.util';
import { USERNAME_PATTERN } from '../users/username';
import {
  DEMO_EMAIL_DOMAIN,
  DEMO_EXERCISE_NAMES,
  generateDemoData,
  storedStats,
} from './demo-data';

const now = new Date('2026-10-28T20:00:00Z');
const exerciseIds = new Map(
  DEMO_EXERCISE_NAMES.map((name, i) => [name, `exercise-${i}`]),
);
const generate = (takenHandles?: Set<string>) =>
  generateDemoData({ seed: 7, now, userCount: 40, exerciseIds, takenHandles });

describe('generateDemoData', () => {
  const data = generate();
  const follows = new Set(
    data.connections.map((c) => `${c.followerId}>${c.followingId}`),
  );

  it('is deterministic for a seed and a date', () => {
    expect(JSON.stringify(generate())).toBe(JSON.stringify(data));
  });

  it('creates valid, unique accounts on the demo domain', () => {
    const handles = data.users.map((u) => u.uniqueName);

    expect(data.users).toHaveLength(41);
    expect(new Set(handles).size).toBe(handles.length);
    for (const user of data.users) {
      expect(user.uniqueName).toMatch(USERNAME_PATTERN);
      expect(user.uniqueName.length).toBeLessThanOrEqual(30);
      expect(user.email).toBe(`${user.uniqueName}@${DEMO_EMAIL_DOMAIN}`);
    }
    expect(data.users[0]).toMatchObject({
      uniqueName: 'lucas.moreau',
      showcase: true,
    });
  });

  it('avoids the usernames already taken', () => {
    const users = generate(new Set(['lucas.moreau'])).users;

    expect(users[0].uniqueName).not.toBe('lucas.moreau');
    expect(users[0].uniqueName).toMatch(/^lucas\.moreau\d+$/);
  });

  it('never dates anything in the future', () => {
    const dates = [
      ...data.users.map((u) => u.createdAt),
      ...data.connections.map((c) => c.createdAt),
      ...data.workouts.flatMap((w) => [w.completionDate, w.createdAt]),
      ...data.posts.map((p) => p.createdAt),
      ...data.likes.map((l) => l.createdAt),
      ...data.comments.map((c) => c.createdAt),
    ];

    expect(dates.every((d) => +d <= +now)).toBe(true);
  });

  it('keeps the counters of posts equal to their likes and comments', () => {
    for (const post of data.posts) {
      expect(data.likes.filter((l) => l.postId === post.id)).toHaveLength(
        post.likesCount,
      );
      expect(data.comments.filter((c) => c.postId === post.id)).toHaveLength(
        post.commentsCount,
      );
    }
    const likeKeys = data.likes.map((l) => `${l.userId}:${l.postId}`);

    expect(new Set(likeKeys).size).toBe(likeKeys.length);
  });

  it('tags as partners followers of the author mentioned in the title', () => {
    const posts = new Map(data.posts.map((p) => [p.id, p]));
    const workouts = new Map(data.workouts.map((w) => [w.id, w]));
    const handles = new Map(data.users.map((u) => [u.id, u.uniqueName]));

    expect(data.partners.length).toBeGreaterThan(0);
    for (const partner of data.partners) {
      const post = posts.get(partner.postId)!;
      const workout = workouts.get(post.workoutId)!;

      expect(follows.has(`${partner.userId}>${post.userId}`)).toBe(true);
      expect(extractMentions(workout.title, workout.description)).toContain(
        handles.get(partner.userId),
      );
    }
  });

  it('stores the stats the API would rebuild from the whole history', () => {
    for (const { userId, exerciseId, stats } of data.stats) {
      const sessions = data.workouts
        .filter((w) => w.userId === userId)
        .flatMap((w) =>
          w.exercises
            .filter((e) => e.exerciseId === exerciseId)
            .map((e) => ({
              workoutId: w.id,
              completedAt: w.completionDate,
              createdAt: w.createdAt,
              sets: e.sets,
            })),
        );
      expect(stats).toEqual(storedStats(buildExerciseStats(sessions)!));
    }
  });

  it('only uses exercises of the catalogue and integer weights', () => {
    const known = new Set(exerciseIds.values());

    for (const workout of data.workouts)
      for (const exercise of workout.exercises) {
        expect(known.has(exercise.exerciseId)).toBe(true);
        for (const set of exercise.sets) {
          expect(Number.isInteger(set.weight)).toBe(true);
          expect(set.reps).toBeGreaterThan(0);
        }
      }
  });
});
