import { DataSource } from 'typeorm';

/**
 * Differences between the entities and the live database schema, as the SQL
 * that synchronize would run to align them. `missing` is what the code needs
 * and the database lacks: a column, table, index or type to add or change,
 * and queries that touch it fail. `extra` is what the database has and the
 * code does not use, which the API does not notice.
 *
 * The SQL is only read, never run: TypeORM guesses renames (a missing column
 * next to an unknown one of the same type becomes a RENAME), and applying its
 * guesses to production is exactly what synchronize was turned off for.
 */
export interface SchemaDrift {
  missing: string[];
  extra: string[];
}

const EXTRA =
  /^\s*(ALTER TABLE \S+ DROP (COLUMN|CONSTRAINT)|DROP (INDEX|TABLE|TYPE))\b/i;

/** Sorts the statements of a schema diff into missing and extra objects. */
export function classifySchemaQueries(queries: string[]): SchemaDrift {
  const drift: SchemaDrift = { missing: [], extra: [] };

  for (const query of queries)
    (EXTRA.test(query) ? drift.extra : drift.missing).push(query.trim());
  return drift;
}

/** Compares the entities loaded in the data source with the live schema. */
export async function findSchemaDrift(
  dataSource: DataSource,
): Promise<SchemaDrift> {
  const sql = await dataSource.driver.createSchemaBuilder().log();

  return classifySchemaQueries(sql.upQueries.map((q) => q.query));
}
