import { MigrationInterface, QueryRunner } from 'typeorm';

// Posts sent to a group by its members. Same SQL as `migration:generate`
// produces from the entity, made idempotent like the other migrations.
// down() drops the table, its index and foreign keys going with it.
const FOREIGN_KEYS: Array<[name: string, definition: string]> = [
  ['FK_group_shares_group', '("groupId") REFERENCES "groups"("id")'],
  ['FK_group_shares_post', '("postId") REFERENCES "posts"("id")'],
  ['FK_group_shares_sharer', '("sharerId") REFERENCES "users"("id")'],
];

export class AddGroupShares1792605872867 implements MigrationInterface {
  name = 'AddGroupShares1792605872867';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "group_shares" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "groupId" uuid NOT NULL, "postId" uuid NOT NULL, "sharerId" uuid NOT NULL, CONSTRAINT "UQ_group_shares_group_post" UNIQUE ("groupId", "postId"), CONSTRAINT "PK_group_shares" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_shares_post" ON "group_shares" ("postId")`,
    );
    for (const [name, definition] of FOREIGN_KEYS)
      await queryRunner.query(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
             ALTER TABLE "group_shares" ADD CONSTRAINT "${name}" FOREIGN KEY ${definition} ON DELETE CASCADE ON UPDATE NO ACTION;
           END IF;
         END $$`,
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "group_shares"`);
  }
}
