import { join } from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DatabaseLogger } from './database.logger';

type EnvGetter = (key: string, fallback?: string) => string | undefined;

// The same file is loaded as TypeScript by ts-node (CLI, tests) and as
// JavaScript from dist, and dist also holds .d.ts declaration files that must
// not be picked up by the glob.
const SOURCE_EXTENSION = __filename.endsWith('.ts') ? 'ts' : 'js';

export const ENTITIES_GLOB = join(
  __dirname,
  '..',
  '**',
  `*.entity.${SOURCE_EXTENSION}`,
);

/**
 * Connection options shared by the Nest application and the TypeORM CLI, so
 * both always talk to the database the same way. Reads through a getter so it
 * works with ConfigService in the app and with process.env in data-source.ts.
 *
 * DB_SYNCHRONIZE defaults to true, which is the historical behaviour. It should
 * be switched to false once a baseline migration exists, see PERFORMANCE.md.
 * DB_SSL=false turns TLS off for a local Postgres. DB_LOGGING=true prints every
 * query with its parameters, which is for development only. DB_SLOW_QUERY_MS is
 * the threshold above which a query is logged as slow, without parameters.
 */
export function buildDatabaseOptions(
  get: EnvGetter,
): PostgresConnectionOptions {
  return {
    type: 'postgres',
    host: get('DB_HOST', 'localhost'),
    port: Number(get('DB_PORT', '5432')),
    username: get('DB_USER', 'postgres'),
    password: get('DB_PASSWORD', 'postgres'),
    database: get('DB_NAME', 'postgres'),
    ssl:
      get('DB_SSL', 'true') === 'false' ? false : { rejectUnauthorized: false },
    synchronize: get('DB_SYNCHRONIZE', 'true') === 'true',
    logger: new DatabaseLogger(get('DB_LOGGING') === 'true'),
    maxQueryExecutionTime: Number(get('DB_SLOW_QUERY_MS', '300')),
    migrations: [join(__dirname, '..', 'migrations', `*.${SOURCE_EXTENSION}`)],
  };
}
