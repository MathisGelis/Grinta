import { MigrationInterface, QueryRunner } from 'typeorm';

// Profile photo of a user and photo of a completed workout, as the URL of the
// stored file. Same SQL as `migration:generate`, made idempotent so it is a
// no-op where synchronize already added the columns.
const COLUMNS: Array<[table: string, column: string]> = [
  ['users', 'avatarUrl'],
  ['completed_workouts', 'photoUrl'],
];

export class AddPhotos1792605872860 implements MigrationInterface {
  name = 'AddPhotos1792605872860';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of COLUMNS)
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" text`,
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of [...COLUMNS].reverse())
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`,
      );
  }
}
