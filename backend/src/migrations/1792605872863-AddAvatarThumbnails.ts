import { MigrationInterface, QueryRunner } from 'typeorm';

// 128 px copy of the profile photo, shown in lists. Same SQL as
// `migration:generate`, made idempotent so it is a no-op where synchronize
// already added the column. Lists fall back to the full photo while a user
// has none (photos uploaded before this migration).
export class AddAvatarThumbnails1792605872863 implements MigrationInterface {
  name = 'AddAvatarThumbnails1792605872863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarThumbnailUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "avatarThumbnailUrl"`,
    );
  }
}
