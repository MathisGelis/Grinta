import { MigrationInterface, QueryRunner } from 'typeorm';

// Pending e-mail changes (hashed tokens, link sent to the new address).
// down() drops the table.
export class AddEmailChangeTokens1792605872877 implements MigrationInterface {
  name = 'AddEmailChangeTokens1792605872877';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "email_change_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "newEmail" character varying(254) NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_email_change_tokens" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_email_change_tokens_hash" ON "email_change_tokens" ("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_change_tokens_user" ON "email_change_tokens" ("userId")`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_email_change_tokens_user') THEN
           ALTER TABLE "email_change_tokens" ADD CONSTRAINT "FK_email_change_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
         END IF;
       END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "email_change_tokens"`);
  }
}
