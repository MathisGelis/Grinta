import { MigrationInterface, QueryRunner } from 'typeorm';

// The day of the programme the start date is, to start a programme midway.
// Existing rows started on day 1, the default. down() drops the column; a
// programme started midway then reads as started on day 1.
export class AddActiveProgrammeStartDay1792605872876 implements MigrationInterface {
  name = 'AddActiveProgrammeStartDay1792605872876';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "active_programmes" ADD COLUMN IF NOT EXISTS "startDay" integer NOT NULL DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "active_programmes" DROP COLUMN IF EXISTS "startDay"`,
    );
  }
}
