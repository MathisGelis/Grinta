import { MigrationInterface, QueryRunner } from 'typeorm';

// Expected duration of a planned workout, entered by the user (1 to 600
// minutes, checked by the DTOs). Nullable: existing plans have none. Same SQL
// as `migration:generate`, made idempotent like the other migrations.
export class AddPlannedWorkoutDuration1792605872869 implements MigrationInterface {
  name = 'AddPlannedWorkoutDuration1792605872869';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planned_workouts" ADD COLUMN IF NOT EXISTS "estimatedDurationMinutes" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planned_workouts" DROP COLUMN IF EXISTS "estimatedDurationMinutes"`,
    );
  }
}
