import { MigrationInterface, QueryRunner } from 'typeorm';

// Groups of friends: the groups, their members and the pending invitations.
// Same SQL as `migration:generate` produces from the entities, made
// idempotent like the other migrations. down() drops the three tables, their
// indexes and foreign keys going with them.
const TABLES = [
  `CREATE TABLE IF NOT EXISTS "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "creatorId" uuid NOT NULL, CONSTRAINT "PK_groups" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "IDX_groups_creator" ON "groups" ("creatorId")`,
  `CREATE TABLE IF NOT EXISTS "group_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "groupId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "UQ_group_members_group_user" UNIQUE ("groupId", "userId"), CONSTRAINT "PK_group_members" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "IDX_group_members_user" ON "group_members" ("userId")`,
  `CREATE TABLE IF NOT EXISTS "group_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "groupId" uuid NOT NULL, "inviteeId" uuid NOT NULL, "inviterId" uuid NOT NULL, CONSTRAINT "UQ_group_invitations_group_invitee" UNIQUE ("groupId", "inviteeId"), CONSTRAINT "PK_group_invitations" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "IDX_group_invitations_invitee" ON "group_invitations" ("inviteeId")`,
];

const FOREIGN_KEYS: Array<[table: string, name: string, definition: string]> = [
  ['groups', 'FK_groups_creator', '("creatorId") REFERENCES "users"("id")'],
  [
    'group_members',
    'FK_group_members_group',
    '("groupId") REFERENCES "groups"("id")',
  ],
  [
    'group_members',
    'FK_group_members_user',
    '("userId") REFERENCES "users"("id")',
  ],
  [
    'group_invitations',
    'FK_group_invitations_group',
    '("groupId") REFERENCES "groups"("id")',
  ],
  [
    'group_invitations',
    'FK_group_invitations_invitee',
    '("inviteeId") REFERENCES "users"("id")',
  ],
  [
    'group_invitations',
    'FK_group_invitations_inviter',
    '("inviterId") REFERENCES "users"("id")',
  ],
];

export class AddGroups1792605872866 implements MigrationInterface {
  name = 'AddGroups1792605872866';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const statement of TABLES) await queryRunner.query(statement);
    for (const [table, name, definition] of FOREIGN_KEYS)
      await queryRunner.query(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN
             ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ${definition} ON DELETE CASCADE ON UPDATE NO ACTION;
           END IF;
         END $$`,
      );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['group_invitations', 'group_members', 'groups'])
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
  }
}
