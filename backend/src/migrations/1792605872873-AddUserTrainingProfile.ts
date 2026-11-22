import { MigrationInterface, QueryRunner } from 'typeorm';

// Level, training days per week and location given at onboarding, all
// optional; they pick the recommended workout templates. Same SQL as
// `migration:generate`, made idempotent like the other migrations. down()
// drops the columns, then their types.
const ENUMS: Array<[column: string, type: string, values: string[]]> = [
  ['level', 'users_level_enum', ['beginner', 'intermediate', 'advanced']],
  ['trainingLocation', 'users_traininglocation_enum', ['gym', 'home']],
];

export class AddUserTrainingProfile1792605872873 implements MigrationInterface {
  name = 'AddUserTrainingProfile1792605872873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [column, type, values] of ENUMS) {
      await queryRunner.query(
        `DO $$ BEGIN
           CREATE TYPE "public"."${type}" AS ENUM(${values.map((v) => `'${v}'`).join(', ')});
         EXCEPTION WHEN duplicate_object THEN NULL;
         END $$`,
      );
      await queryRunner.query(
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "${column}" "public"."${type}"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trainingDaysPerWeek" smallint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "trainingDaysPerWeek"`,
    );
    for (const [column, type] of [...ENUMS].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "users" DROP COLUMN IF EXISTS "${column}"`,
      );
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."${type}"`);
    }
  }
}
