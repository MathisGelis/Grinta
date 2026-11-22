import { Logger as NestLogger } from '@nestjs/common';
import { Logger } from 'typeorm';

/**
 * TypeORM logger that never writes bound parameters unless every query is
 * being logged on purpose (DB_LOGGING=true, development only). Slow queries
 * are reported in production, but a slow INSERT into users must not leave an
 * email address or a password hash in the process log. Failed queries are not
 * logged here: AllExceptionsFilter already logs the error with its stack.
 */
export class DatabaseLogger implements Logger {
  private readonly logger = new NestLogger('Database');

  /**
   * logSchemaBuild: print what TypeORM reports while building the schema,
   * which includes the progress of `migration:run` (pending migrations, each
   * one executed). For the migration CLI only: a schema comparison reports
   * the same way ("new columns added") without changing anything, and would
   * read as if it had in the API logs.
   */
  constructor(
    private readonly logEveryQuery: boolean,
    private readonly logSchemaBuildMessages = false,
  ) {}

  logQuery(query: string, parameters?: unknown[]) {
    if (this.logEveryQuery)
      this.logger.log(`${query} -- ${JSON.stringify(parameters ?? [])}`);
  }

  logQuerySlow(time: number, query: string) {
    this.logger.warn(`Slow query, ${time} ms: ${query}`);
  }

  logQueryError() {}

  logSchemaBuild(message: string) {
    if (this.logSchemaBuildMessages) this.logger.log(message);
  }

  logMigration(message: string) {
    this.logger.log(message);
  }

  log() {}
}
