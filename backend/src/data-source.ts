import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  buildDatabaseOptions,
  ENTITIES_GLOB,
} from './database/database.config';
import { DatabaseLogger } from './database/database.logger';

config();

// Used by the TypeORM CLI only (migration:run, migration:generate, ...). The
// application builds its own connection in DatabaseModule from the same options.
export default new DataSource({
  ...buildDatabaseOptions((key, fallback) => process.env[key] ?? fallback),
  entities: [ENTITIES_GLOB],
  // The CLI must never reshape the schema behind a migration's back.
  synchronize: false,
  // Prints which migrations are pending and which ran: without it,
  // migration:run says nothing, whether it applied ten migrations or none.
  logger: new DatabaseLogger(process.env.DB_LOGGING === 'true', true),
});
