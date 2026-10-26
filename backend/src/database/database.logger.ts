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

  constructor(private readonly logEveryQuery: boolean) {}

  logQuery(query: string, parameters?: unknown[]) {
    if (this.logEveryQuery)
      this.logger.log(`${query} -- ${JSON.stringify(parameters ?? [])}`);
  }

  logQuerySlow(time: number, query: string) {
    this.logger.warn(`Slow query, ${time} ms: ${query}`);
  }

  logQueryError() {}

  logSchemaBuild() {}

  logMigration(message: string) {
    this.logger.log(message);
  }

  log() {}
}
