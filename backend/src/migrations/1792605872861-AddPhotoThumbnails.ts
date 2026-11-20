import { MigrationInterface, QueryRunner } from 'typeorm';

// 600 px copy of the workout photo, shown in lists and feeds so that scrolling
// does not download full photos. Same SQL as `migration:generate`, made
// idempotent so it is a no-op where synchronize already added the column.
export class AddPhotoThumbnails1792605872861 implements MigrationInterface {
  name = 'AddPhotoThumbnails1792605872861';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "completed_workouts" ADD COLUMN IF NOT EXISTS "photoThumbnailUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "completed_workouts" DROP COLUMN IF EXISTS "photoThumbnailUrl"`,
    );
  }
}
