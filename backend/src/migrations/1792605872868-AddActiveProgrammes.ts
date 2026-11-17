import { MigrationInterface, QueryRunner } from 'typeorm';

// The programme each user follows, one per user. Same SQL as
// `migration:generate` produces from the entity, made idempotent like the
// other migrations. down() drops the table, its index and foreign keys going
// with it.
const FOREIGN_KEYS: Array<[name: string, definition: string]> = [
  ['FK_active_programmes_user', '("userId") REFERENCES "users"("id")'],
  [
    'FK_active_programmes_programme',
    '("programmeId") REFERENCES "programmes"("id")',
  ],
];

export class AddActiveProgrammes1792605872868 implements MigrationInterface {
  name = 'AddActiveProgrammes1792605872868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "active_programmes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startedOn" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "programmeId" uuid NOT NULL, CONSTRAINT "UQ_active_programmes_user" UNIQUE ("userId"), CONSTRAINT "PK_active_programmes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_active_programmes_programme" ON "active_programmes" ("programmeId")`,
    );
    for (const [name, definition] of FOREIGN_KEYS)
      await queryRunner.query(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
             ALTER TABLE "active_programmes" ADD CONSTRAINT "${name}" FOREIGN KEY ${definition} ON DELETE CASCADE ON UPDATE NO ACTION;
           END IF;
         END $$`,
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "active_programmes"`);
  }
}
