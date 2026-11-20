import { MigrationInterface, QueryRunner } from 'typeorm';

// Postgres does not index foreign key columns automatically, and none of these
// were covered by a unique constraint. Measured on 69k workouts and 291k likes:
// feed/top went from about 4 s to a few ms, see PERFORMANCE.md. The same
// indexes are declared on the entities so a synchronize run keeps them instead
// of dropping them as unknown. IF NOT EXISTS makes this migration a no-op on a
// database where synchronize already created them.
const INDEXES: Array<[name: string, table: string, columns: string]> = [
  [
    'IDX_completed_workouts_user_date',
    'completed_workouts',
    '"userId", "completionDate"',
  ],
  [
    'IDX_completed_workout_exercises_workout',
    'completed_workout_exercises',
    '"workoutId"',
  ],
  [
    'IDX_planned_workouts_user_created',
    'planned_workouts',
    '"userId", "createdAt"',
  ],
  [
    'IDX_planned_workout_exercises_workout',
    'planned_workout_exercises',
    '"workoutId"',
  ],
  ['IDX_programmes_user', 'programmes', '"userId"'],
  ['IDX_programme_days_workout', 'programme_days', '"workoutId"'],
  ['IDX_posts_user_created', 'posts', '"userId", "createdAt"'],
  ['IDX_posts_created', 'posts', '"createdAt"'],
  ['IDX_post_likes_post', 'post_likes', '"postId"'],
  ['IDX_post_comments_post_created', 'post_comments', '"postId", "createdAt"'],
  ['IDX_comment_reports_comment', 'comment_reports', '"commentId"'],
  ['IDX_connections_following', 'connections', '"followingId"'],
  ['IDX_follow_requests_following', 'follow_requests', '"followingId"'],
];

export class AddForeignKeyIndexes1790935338305 implements MigrationInterface {
  name = 'AddForeignKeyIndexes1790935338305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, table, columns] of INDEXES)
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" (${columns})`,
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [name] of [...INDEXES].reverse())
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
  }
}
