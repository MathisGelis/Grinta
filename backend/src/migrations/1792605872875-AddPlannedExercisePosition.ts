import { MigrationInterface, QueryRunner } from 'typeorm';

// The rank of each exercise in its planned workout. Until now the order was
// the physical order of the rows, which Postgres does not guarantee: a join
// (GET /programmes/active/today) gave the exercises in any order. Existing
// rows get their current physical order, the order they were inserted in.
// The backfill only runs when the column is created, so running the
// migration again never overwrites positions. down() drops the column.
export class AddPlannedExercisePosition1792605872875 implements MigrationInterface {
  name = 'AddPlannedExercisePosition1792605872875';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'planned_workout_exercises' AND column_name = 'position'
         ) THEN
           ALTER TABLE "planned_workout_exercises" ADD "position" integer NOT NULL DEFAULT '0';
           UPDATE "planned_workout_exercises" e
              SET "position" = ranked.rank
             FROM (
               SELECT id, (row_number() OVER (PARTITION BY "workoutId" ORDER BY ctid) - 1)::int AS rank
                 FROM "planned_workout_exercises"
             ) ranked
            WHERE ranked.id = e.id;
         END IF;
       END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planned_workout_exercises" DROP COLUMN IF EXISTS "position"`,
    );
  }
}
