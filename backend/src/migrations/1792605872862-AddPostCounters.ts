import { MigrationInterface, QueryRunner } from 'typeorm';

// Like and visible comment counters on posts, maintained by PostsService.
// Filled from the existing rows; the columns are added only if missing, so
// the migration also fills them where synchronize created them at 0.
export class AddPostCounters1792605872862 implements MigrationInterface {
  name = 'AddPostCounters1792605872862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of ['likesCount', 'commentsCount'])
      await queryRunner.query(
        `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "${column}" integer NOT NULL DEFAULT 0`,
      );
    await queryRunner.query(
      `UPDATE posts p
          SET "likesCount" = (SELECT COUNT(*) FROM post_likes l WHERE l."postId" = p.id),
              "commentsCount" = (SELECT COUNT(*) FROM post_comments c WHERE c."postId" = p.id AND NOT c."isHidden")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of ['commentsCount', 'likesCount'])
      await queryRunner.query(
        `ALTER TABLE "posts" DROP COLUMN IF EXISTS "${column}"`,
      );
  }
}
