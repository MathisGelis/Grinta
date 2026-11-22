import { MigrationInterface, QueryRunner } from 'typeorm';

// Gender and goal given at onboarding, both optional. Same SQL as
// `migration:generate`, made idempotent like the other migrations. down()
// drops the columns, then their types.
const ENUMS: Array<[column: string, type: string, values: string[]]> = [
  ['gender', 'users_gender_enum', ['male', 'female', 'other']],
  [
    'goal',
    'users_goal_enum',
    ['gain_weight', 'lose_weight', 'get_fitter', 'flexibility', 'learn_basics'],
  ],
];

export class AddUserGenderAndGoal1792605872870 implements MigrationInterface {
  name = 'AddUserGenderAndGoal1792605872870';

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [column, type] of [...ENUMS].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "users" DROP COLUMN IF EXISTS "${column}"`,
      );
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."${type}"`);
    }
  }
}
