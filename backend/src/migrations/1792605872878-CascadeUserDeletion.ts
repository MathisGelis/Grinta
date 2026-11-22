import { MigrationInterface, QueryRunner } from 'typeorm';

// Deleting an account removes everything it owns. These foreign keys to
// "users" were NO ACTION, so DELETE /users/:id failed (500) for any account
// with a workout. They become ON DELETE CASCADE, keeping their names.
// down() puts NO ACTION back.
const LINKS: Array<[table: string, column: string]> = [
  ['comment_reports', 'reporterId'],
  ['completed_workouts', 'userId'],
  ['follow_requests', 'followerId'],
  ['follow_requests', 'followingId'],
  ['planned_workouts', 'userId'],
  ['post_comments', 'userId'],
  ['post_likes', 'userId'],
  ['posts', 'userId'],
  ['programmes', 'userId'],
];

async function setAction(queryRunner: QueryRunner, action: string) {
  for (const [table, column] of LINKS) {
    await queryRunner.query(
      `DO $$
       DECLARE c text;
       BEGIN
         SELECT con.conname INTO c
           FROM pg_constraint con
           JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
          WHERE con.contype = 'f' AND con.conrelid = '"${table}"'::regclass
            AND con.confrelid = '"users"'::regclass AND att.attname = '${column}';
         IF c IS NOT NULL THEN
           EXECUTE format('ALTER TABLE "${table}" DROP CONSTRAINT %I', c);
           EXECUTE format('ALTER TABLE "${table}" ADD CONSTRAINT %I FOREIGN KEY ("${column}") REFERENCES "users"("id") ON DELETE ${action} ON UPDATE NO ACTION', c);
         END IF;
       END $$`,
    );
  }
}

export class CascadeUserDeletion1792605872878 implements MigrationInterface {
  name = 'CascadeUserDeletion1792605872878';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await setAction(queryRunner, 'CASCADE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await setAction(queryRunner, 'NO ACTION');
  }
}
