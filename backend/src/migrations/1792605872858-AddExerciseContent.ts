import { MigrationInterface, QueryRunner } from 'typeorm';

// Description, step-by-step instructions and start/end position photos for
// the exercise catalogue, filled by the seed from base-exercises.json. Same
// SQL as `migration:generate`, made idempotent so it is a no-op where
// synchronize already added the columns.
const COLUMNS: Array<[name: string, definition: string]> = [
  ['description', 'text'],
  ['instructions', 'text array'],
  ['image_urls', 'text array'],
];

export class AddExerciseContent1792605872858 implements MigrationInterface {
  name = 'AddExerciseContent1792605872858';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, definition] of COLUMNS)
      await queryRunner.query(
        `ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "${name}" ${definition}`,
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [name] of [...COLUMNS].reverse())
      await queryRunner.query(
        `ALTER TABLE "exercises" DROP COLUMN IF EXISTS "${name}"`,
      );
  }
}
