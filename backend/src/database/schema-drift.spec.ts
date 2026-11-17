import { classifySchemaQueries } from './schema-drift';

describe('classifySchemaQueries', () => {
  it('reports nothing for a schema that matches the entities', () => {
    expect(classifySchemaQueries([])).toEqual({ missing: [], extra: [] });
  });

  it('counts what the code needs and the database lacks as missing', () => {
    const queries = [
      'ALTER TABLE "exercises" ADD "description" text',
      'CREATE TABLE "post_partners" ("id" uuid NOT NULL)',
      'CREATE INDEX "IDX_badges_exercise" ON "badges" ("exerciseId")',
      // A guessed rename means the expected column is not there.
      'ALTER TABLE "users" RENAME COLUMN "legacy" TO "avatarUrl"',
      'ALTER TABLE "posts" ALTER COLUMN "likesCount" SET NOT NULL',
    ];

    expect(classifySchemaQueries(queries)).toEqual({
      missing: queries,
      extra: [],
    });
  });

  it('counts what only the database has as extra', () => {
    const queries = [
      'ALTER TABLE "users" DROP COLUMN "legacy"',
      'ALTER TABLE "posts" DROP CONSTRAINT "FK_old"',
      'DROP INDEX "public"."IDX_duplicate"',
      'DROP TABLE "old_table"',
      'DROP TYPE "public"."old_enum"',
    ];

    expect(classifySchemaQueries(queries)).toEqual({
      missing: [],
      extra: queries,
    });
  });

  it('still reports a changed column, dropped then added back, as missing', () => {
    const drift = classifySchemaQueries([
      'ALTER TABLE "users" DROP COLUMN "height"',
      'ALTER TABLE "users" ADD "height" double precision',
    ]);

    expect(drift.missing).toEqual([
      'ALTER TABLE "users" ADD "height" double precision',
    ]);
    expect(drift.extra).toHaveLength(1);
  });
});
