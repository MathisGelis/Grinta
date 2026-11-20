import { MigrationInterface, QueryRunner } from 'typeorm';

// Per-exercise stats derived from completed workouts, and badges for personal
// records. Same SQL as `migration:generate` produces from the entities, made
// idempotent so it is a no-op where synchronize already created the objects.
// down() drops the badges and the stats columns: the stats are recomputable
// with `npm run backfill:exercise-stats`, the badges are not.
const STATS_COLUMNS: Array<[name: string, definition: string]> = [
  ['pr_reps', 'integer'],
  ['best_estimated_1rm', 'double precision'],
  ['best_session_volume', 'double precision'],
  ['max_reps', 'integer'],
  ['last_sets', 'jsonb'],
  ['last_performed_at', 'TIMESTAMP'],
  ['total_sessions', `integer NOT NULL DEFAULT '0'`],
  ['total_sets', `integer NOT NULL DEFAULT '0'`],
  ['total_reps', `integer NOT NULL DEFAULT '0'`],
  ['total_volume', `double precision NOT NULL DEFAULT '0'`],
];

export class AddExerciseStatsAndBadges1792605872857 implements MigrationInterface {
  name = 'AddExerciseStatsAndBadges1792605872857';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, definition] of STATS_COLUMNS)
      await queryRunner.query(
        `ALTER TABLE "user_exercise_stats" ADD COLUMN IF NOT EXISTS "${name}" ${definition}`,
      );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."badges_type_enum" AS ENUM('heaviest_weight', 'best_estimated_1rm', 'best_session_volume', 'most_reps');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."badges_type_enum" NOT NULL,
        "value" double precision NOT NULL,
        "previousValue" double precision NOT NULL,
        "weight" double precision,
        "reps" integer,
        "achievedAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "exerciseId" uuid NOT NULL,
        "workoutId" uuid NOT NULL,
        CONSTRAINT "UQ_badges_workout_exercise_type" UNIQUE ("workoutId", "exerciseId", "type"),
        CONSTRAINT "PK_badges" PRIMARY KEY ("id"),
        CONSTRAINT "FK_badges_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_badges_exercise" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_badges_workout" FOREIGN KEY ("workoutId") REFERENCES "completed_workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_badges_exercise" ON "badges" ("exerciseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_badges_user_achieved" ON "badges" ("userId", "achievedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "badges"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."badges_type_enum"`);
    for (const [name] of [...STATS_COLUMNS].reverse())
      await queryRunner.query(
        `ALTER TABLE "user_exercise_stats" DROP COLUMN IF EXISTS "${name}"`,
      );
  }
}
