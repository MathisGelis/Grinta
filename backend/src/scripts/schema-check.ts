import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  buildDatabaseOptions,
  ENTITIES_GLOB,
} from '../database/database.config';
import { findSchemaDrift } from '../database/schema-drift';

// Checks that the database has everything the entities use, after the
// migrations ran. The migrations table only says which migrations were
// recorded, not that their changes are still there: production once had all
// of them recorded with columns missing. Exits 1 on a missing column, table
// or index, which stops deploy.sh before the API restarts on code the schema
// cannot serve. Objects only the database has are listed without failing.
// Read-only.
//
//   npm run schema:check:prod
config();

async function run() {
  const dataSource = new DataSource({
    ...buildDatabaseOptions((key, fallback) => process.env[key] ?? fallback),
    entities: [ENTITIES_GLOB],
    migrations: [],
    synchronize: false,
  });

  await dataSource.initialize();
  const drift = await findSchemaDrift(dataSource).finally(() =>
    dataSource.destroy(),
  );

  for (const query of drift.extra) console.warn(`Unused by the code: ${query}`);
  if (!drift.missing.length) {
    console.log('Schema OK: the database has everything the entities use');
    return;
  }
  console.error(
    `Schema drift: ${drift.missing.length} changes the code needs are missing from the database`,
  );
  for (const query of drift.missing) console.error(`  ${query}`);
  console.error(
    'Add a migration that creates them (idempotent, see RepairSchemaDrift); never run these statements as they are',
  );
  process.exitCode = 1;
}

run().catch((err: Error) => {
  console.error('Schema check failed:', err.message);
  process.exit(1);
});
