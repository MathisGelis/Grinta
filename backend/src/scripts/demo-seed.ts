import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import sharp from 'sharp';
import { DataSource, EntityManager } from 'typeorm';
import { BCRYPT_ROUNDS } from '../auth/auth.constants';
import { buildDatabaseOptions } from '../database/database.config';
import {
  DEMO_EMAIL_DOMAIN,
  DEMO_EXERCISE_NAMES,
  DemoData,
  DemoUser,
  generateDemoData,
} from '../demo/demo-data';
import { processPhoto } from '../photos/photo-processing';
import { PhotoStorage } from '../photos/photo-storage';
import { createPhotoStorage } from '../photos/photo-storage.factory';
import { readPhotoStorageConfig } from '../photos/photos.config';

// Fills the database with fictitious people and months of activity for a
// demo, or removes them again. Every demo account has an email on
// DEMO_EMAIL_DOMAIN; real accounts are never modified, except that their
// likes, comments and follows on demo content disappear with it.
//
//   DEMO_PASSWORD='...' npm run demo:seed            60 people (--users=N)
//   npm run demo:clear
//
// The password is the one of every demo account; it is read from the
// environment rather than generated so that it is never printed.
config();

const DEMO_EMAILS = `%@${DEMO_EMAIL_DOMAIN}`;
const BATCH = 500;

async function run() {
  const clear = process.argv.includes('--clear');
  const userCount = Number(argValue('--users') ?? 60);
  const storage = createPhotoStorage(
    readPhotoStorageConfig((key) => process.env[key]),
  );
  const dataSource = new DataSource({
    ...buildDatabaseOptions((key, fallback) => process.env[key] ?? fallback),
    entities: [],
    migrations: [],
    synchronize: false,
  });

  await dataSource.initialize();
  try {
    if (clear) await clearDemo(dataSource, storage);
    else await seedDemo(dataSource, storage, userCount);
  } finally {
    await dataSource.destroy();
  }
}

function argValue(name: string): string | undefined {
  return process.argv
    .find((arg) => arg.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function seedDemo(
  dataSource: DataSource,
  storage: PhotoStorage,
  userCount: number,
) {
  const password = process.env.DEMO_PASSWORD;

  if (!password || password.length < 8)
    throw new Error(
      'Set DEMO_PASSWORD (8 characters or more): it becomes the password of every demo account',
    );
  if (!Number.isInteger(userCount) || userCount < 1 || userCount > 500)
    throw new Error('--users must be between 1 and 500');
  const [{ count }]: Array<{ count: number }> = await dataSource.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE email LIKE $1`,
    [DEMO_EMAILS],
  );

  if (count)
    throw new Error(
      `${count} demo accounts already exist: run "npm run demo:clear" first`,
    );
  const exercises: Array<{ id: string; name: string }> = await dataSource.query(
    `SELECT id, name FROM exercises WHERE name = ANY($1)`,
    [DEMO_EXERCISE_NAMES],
  );
  const exerciseIds = new Map(exercises.map((e) => [e.name, e.id]));
  const missing = DEMO_EXERCISE_NAMES.filter((name) => !exerciseIds.has(name));

  if (missing.length)
    throw new Error(
      `Exercises missing from the catalogue (run "npm run seed"): ${missing.join(', ')}`,
    );
  const handles: Array<{ uniqueName: string }> = await dataSource.query(
    `SELECT "uniqueName" FROM users`,
  );
  const data = generateDemoData({
    seed: Number(argValue('--seed') ?? 2026),
    now: new Date(),
    userCount,
    exerciseIds,
    takenHandles: new Set(handles.map((h) => h.uniqueName)),
  });
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  console.log(
    `Generating ${data.users.filter((u) => u.avatar).length} avatars`,
  );
  const avatars = await uploadAvatars(storage, data.users);

  try {
    await dataSource.transaction((manager) =>
      insertDemo(manager, data, hash, avatars),
    );
  } catch (error) {
    await Promise.all(
      [...avatars.values()].flatMap((a) => [
        storage.remove(a.url),
        storage.remove(a.thumbnailUrl),
      ]),
    );
    throw error;
  }
  const showcase = data.users[0];

  console.log(
    [
      `Demo ready: ${data.users.length} people, ${data.connections.length} follows,`,
      `${data.workouts.length} workouts, ${data.posts.length} posts,`,
      `${data.likes.length} likes, ${data.comments.length} comments,`,
      `${data.partners.length} tagged partners, ${data.badges.length} badges.`,
    ].join(' '),
  );
  console.log(
    `Log in as ${showcase.email} (@${showcase.uniqueName}) with DEMO_PASSWORD`,
  );
}

async function insertDemo(
  manager: EntityManager,
  data: DemoData,
  hash: string,
  avatars: Map<string, { url: string; thumbnailUrl: string }>,
) {
  await insert(
    manager,
    'users',
    [
      'id',
      'email',
      'password',
      'displayName',
      'uniqueName',
      'isPublic',
      'birthDate',
      'height',
      'weight',
      'createdAt',
      'avatarUrl',
      'avatarThumbnailUrl',
    ],
    data.users.map((u) => [
      u.id,
      u.email,
      hash,
      u.displayName,
      u.uniqueName,
      u.isPublic,
      u.birthDate,
      u.height,
      u.weight,
      u.createdAt,
      avatars.get(u.id)?.url ?? null,
      avatars.get(u.id)?.thumbnailUrl ?? null,
    ]),
  );
  await insert(
    manager,
    'connections',
    ['id', 'followerId', 'followingId', 'createdAt'],
    data.connections.map((c) => [
      c.id,
      c.followerId,
      c.followingId,
      c.createdAt,
    ]),
  );
  await insert(
    manager,
    'planned_workouts',
    ['id', 'userId', 'title', 'description', 'createdAt'],
    data.plannedWorkouts.map((p) => [
      p.id,
      p.userId,
      p.title,
      p.description,
      p.createdAt,
    ]),
  );
  await insert(
    manager,
    'planned_workout_exercises',
    ['id', 'workoutId', 'exerciseId', 'sets', 'plannedRestSeconds'],
    data.plannedExercises.map((e) => [
      e.id,
      e.workoutId,
      e.exerciseId,
      JSON.stringify(e.sets),
      e.plannedRestSeconds,
    ]),
  );
  await insert(
    manager,
    'programmes',
    [
      'id',
      'userId',
      'weekNumber',
      'difficulty',
      'locationType',
      'title',
      'description',
    ],
    data.programmes.map((p) => [
      p.id,
      p.userId,
      p.weekNumber,
      p.difficulty,
      p.locationType,
      p.title,
      p.description,
    ]),
  );
  await insert(
    manager,
    'programme_days',
    ['id', 'programmeId', 'dayNumber', 'workoutId'],
    data.programmeDays.map((d) => [
      d.id,
      d.programmeId,
      d.dayNumber,
      d.workoutId,
    ]),
  );
  await insert(
    manager,
    'completed_workouts',
    [
      'id',
      'userId',
      'title',
      'description',
      'completionDate',
      'totalDurationSeconds',
      'createdAt',
    ],
    data.workouts.map((w) => [
      w.id,
      w.userId,
      w.title,
      w.description,
      w.completionDate,
      w.totalDurationSeconds,
      w.createdAt,
    ]),
  );
  await insert(
    manager,
    'completed_workout_exercises',
    ['id', 'workoutId', 'exerciseId', 'sets'],
    data.workouts.flatMap((w) =>
      w.exercises.map((e) => [
        e.id,
        w.id,
        e.exerciseId,
        JSON.stringify(e.sets),
      ]),
    ),
  );
  await insert(
    manager,
    'posts',
    ['id', 'userId', 'workoutId', 'createdAt', 'likesCount', 'commentsCount'],
    data.posts.map((p) => [
      p.id,
      p.userId,
      p.workoutId,
      p.createdAt,
      p.likesCount,
      p.commentsCount,
    ]),
  );
  await insert(
    manager,
    'post_likes',
    ['id', 'userId', 'postId', 'createdAt'],
    data.likes.map((l) => [l.id, l.userId, l.postId, l.createdAt]),
  );
  await insert(
    manager,
    'post_comments',
    ['id', 'userId', 'postId', 'content', 'createdAt'],
    data.comments.map((c) => [
      c.id,
      c.userId,
      c.postId,
      c.content,
      c.createdAt,
    ]),
  );
  await insert(
    manager,
    'post_partners',
    ['id', 'postId', 'userId', 'createdAt'],
    data.partners.map((p) => [p.id, p.postId, p.userId, p.createdAt]),
  );
  await insert(
    manager,
    'user_exercise_stats',
    [
      'user_id',
      'exercise_id',
      'PR',
      'pr_reps',
      'best_estimated_1rm',
      'best_session_volume',
      'max_reps',
      'last_reps',
      'last_weight',
      'last_sets',
      'last_performed_at',
      'total_sessions',
      'total_sets',
      'total_reps',
      'total_volume',
    ],
    data.stats.map(({ userId, exerciseId, stats: s }) => [
      userId,
      exerciseId,
      s.prWeight,
      s.prReps,
      s.bestEstimatedOneRepMax,
      s.bestSessionVolume,
      s.maxReps,
      s.lastReps,
      s.lastWeight,
      JSON.stringify(s.lastSets),
      s.lastPerformedAt,
      s.totalSessions,
      s.totalSets,
      s.totalReps,
      s.totalVolume,
    ]),
  );
  await insert(
    manager,
    'badges',
    [
      'id',
      'userId',
      'exerciseId',
      'workoutId',
      'type',
      'value',
      'previousValue',
      'weight',
      'reps',
      'achievedAt',
      'createdAt',
    ],
    data.badges.map((b) => [
      b.id,
      b.userId,
      b.exerciseId,
      b.workoutId,
      b.type,
      b.value,
      b.previousValue,
      b.weight,
      b.reps,
      b.achievedAt,
      b.createdAt,
    ]),
  );
}

/** Multi-row INSERTs, BATCH rows per statement. */
async function insert(
  manager: EntityManager,
  table: string,
  columns: string[],
  rows: unknown[][],
) {
  for (let start = 0; start < rows.length; start += BATCH) {
    const chunk = rows.slice(start, start + BATCH);
    const values = chunk.map(
      (row, r) =>
        `(${row.map((_, c) => `$${r * columns.length + c + 1}`).join(', ')})`,
    );

    await manager.query(
      `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')})
       VALUES ${values.join(', ')}`,
      chunk.flat(),
    );
  }
}

/**
 * A plain avatar per person: a two-colour gradient behind a silhouette. Drawn
 * without text so that it does not depend on the fonts of the machine.
 */
async function uploadAvatars(storage: PhotoStorage, users: DemoUser[]) {
  const avatars = new Map<string, { url: string; thumbnailUrl: string }>();

  for (const user of users.filter((u) => u.avatar)) {
    const hue = parseInt(user.id.slice(0, 6), 16) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${hue},70%,58%)"/>
        <stop offset="1" stop-color="hsl(${(hue + 50) % 360},75%,38%)"/>
      </linearGradient></defs>
      <rect width="512" height="512" fill="url(#g)"/>
      <circle cx="256" cy="200" r="92" fill="rgba(255,255,255,0.88)"/>
      <ellipse cx="256" cy="470" rx="170" ry="150" fill="rgba(255,255,255,0.88)"/>
    </svg>`;
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const photo = await processPhoto(png, 'avatar');
    const url = await storage.save('avatar', photo);
    const thumbnailUrl = await storage.save(
      'avatar_thumbnail',
      await processPhoto(photo, 'avatar_thumbnail'),
    );

    avatars.set(user.id, { url, thumbnailUrl });
  }
  return avatars;
}

/**
 * Removes every demo account and everything that hangs off it, then
 * recounts the counters of the real posts that demo people liked or
 * commented.
 */
async function clearDemo(dataSource: DataSource, storage: PhotoStorage) {
  const photos: Array<{ url: string }> = await dataSource.query(
    `SELECT url FROM users, unnest(ARRAY["avatarUrl", "avatarThumbnailUrl"]) AS url
      WHERE email LIKE $1 AND url IS NOT NULL
     UNION ALL
     SELECT url FROM completed_workouts w JOIN users u ON u.id = w."userId",
            unnest(ARRAY[w."photoUrl", w."photoThumbnailUrl"]) AS url
      WHERE u.email LIKE $1 AND url IS NOT NULL`,
    [DEMO_EMAILS],
  );
  const removed = await dataSource.transaction(async (manager) => {
    const demo = `(SELECT id FROM users WHERE email LIKE $1)`;
    const touched: Array<{ postId: string }> = await manager.query(
      `SELECT DISTINCT "postId" FROM post_likes WHERE "userId" IN ${demo}
       UNION SELECT DISTINCT "postId" FROM post_comments WHERE "userId" IN ${demo}`,
      [DEMO_EMAILS],
    );

    for (const statement of [
      `DELETE FROM comment_reports WHERE "reporterId" IN ${demo}`,
      `DELETE FROM post_comments WHERE "userId" IN ${demo}
          OR "postId" IN (SELECT id FROM posts WHERE "userId" IN ${demo})`,
      `DELETE FROM post_likes WHERE "userId" IN ${demo}
          OR "postId" IN (SELECT id FROM posts WHERE "userId" IN ${demo})`,
      `DELETE FROM posts WHERE "userId" IN ${demo}`,
      `DELETE FROM completed_workouts WHERE "userId" IN ${demo}`,
      `DELETE FROM programmes WHERE "userId" IN ${demo}`,
      `DELETE FROM planned_workouts WHERE "userId" IN ${demo}`,
      `DELETE FROM follow_requests WHERE "followerId" IN ${demo} OR "followingId" IN ${demo}`,
    ])
      await manager.query(statement, [DEMO_EMAILS]);
    const [, count]: [unknown, number] = await manager.query(
      `DELETE FROM users WHERE email LIKE $1`,
      [DEMO_EMAILS],
    );

    if (touched.length)
      await manager.query(
        `UPDATE posts p
            SET "likesCount" = (SELECT COUNT(*) FROM post_likes l WHERE l."postId" = p.id),
                "commentsCount" = (SELECT COUNT(*) FROM post_comments c WHERE c."postId" = p.id AND NOT c."isHidden")
          WHERE p.id = ANY($1)`,
        [touched.map((t) => t.postId)],
      );
    return count;
  });

  for (const { url } of photos) await storage.remove(url);
  console.log(
    `Removed ${removed} demo accounts and ${photos.length} of their photos`,
  );
}

run().catch((err: Error) => {
  console.error('Demo data failed:', err.message);
  process.exit(1);
});
