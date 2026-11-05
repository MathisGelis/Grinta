import { MigrationInterface, QueryRunner } from 'typeorm';

// Apple and Google accounts linked to users, for social sign-in. Same SQL as
// `migration:generate`, made idempotent like the other migrations. down()
// drops the table, which unlinks every social account: those users can
// still sign in with a password after « Mot de passe oublié ».
export class AddUserIdentities1792605872874 implements MigrationInterface {
  name = 'AddUserIdentities1792605872874';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_identities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying(16) NOT NULL, "subject" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_user_identities" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_identities_user" ON "user_identities" ("userId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_identities_provider_subject" ON "user_identities" ("provider", "subject")`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_user_identities_user') THEN
           ALTER TABLE "user_identities" ADD CONSTRAINT "FK_user_identities_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
         END IF;
       END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_identities"`);
  }
}
