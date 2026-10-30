/** Something that can run SQL: a DataSource, an EntityManager or a QueryRunner. */
interface SqlRunner {
  query(sql: string, parameters?: unknown[]): Promise<unknown>;
}

/**
 * Misspelled names of the catalogue, corrected in place so the rows keep
 * their ids, stats and history. Applied by the FixExerciseNames migration and
 * by the seed, before it upserts by name, after the variant renames (they
 * produce the misspelled names on an old database).
 *
 * Frozen like VARIANT_RENAMES_2026_10: a later fix gets its own list.
 */
export const NAME_FIXES_2026_10: ReadonlyArray<{ from: string; to: string }> = [
  { from: 'Baesyan Curl (Cable)', to: 'Bayesian Curl (Cable)' },
  { from: 'Baesyan Curl (Dumbbell)', to: 'Bayesian Curl (Dumbbell)' },
];

/**
 * Renames `from` into `to`, unless a row already has `to`. Returns the new
 * names of the rows renamed.
 */
export async function fixExerciseNames(
  runner: SqlRunner,
  fixes = NAME_FIXES_2026_10,
): Promise<string[]> {
  const rows = await runner.query(
    `UPDATE exercises e
        SET name = r.to_name
       FROM unnest($1::text[], $2::text[]) AS r(from_name, to_name)
      WHERE e.name = r.from_name
        AND NOT EXISTS (SELECT 1 FROM exercises x WHERE x.name = r.to_name)
  RETURNING e.name`,
    [fixes.map((f) => f.from), fixes.map((f) => f.to)],
  );
  // Postgres returns [rows, count] for an UPDATE ... RETURNING through TypeORM.
  const list = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

  return (list as Array<{ name: string }>).map((r) => r.name);
}
