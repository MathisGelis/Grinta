import { MigrationInterface, QueryRunner } from 'typeorm';

// People tagged by @handle in a posted workout. Same SQL as
// `migration:generate`, made idempotent so it is a no-op where synchronize
// already created the table.
const FOREIGN_KEYS: Array<[name: string, definition: string]> = [
  [
    'FK_72f1818c9a62a0e80193d7cf915',
    'FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
  ],
  [
    'FK_92170cfd4f85c548feb77ebbfb2',
    'FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
  ],
];

export class AddPostPartners1792605872864 implements MigrationInterface {
  name = 'AddPostPartners1792605872864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "post_partners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "declined" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_ad574d1c92d545e72405d8492dc" UNIQUE ("postId", "userId"), CONSTRAINT "PK_5c77b9a69d58cdd9dbabac2643a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_post_partners_user" ON "post_partners" ("userId")`,
    );
    for (const [name, definition] of FOREIGN_KEYS)
      await queryRunner.query(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
             ALTER TABLE "post_partners" ADD CONSTRAINT "${name}" ${definition};
           END IF;
         END $$`,
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "post_partners"`);
  }
}
