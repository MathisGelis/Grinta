import { buildDatabaseOptions } from './database.config';
import { DatabaseLogger } from './database.logger';

const from =
  (env: Record<string, string>) => (key: string, fallback?: string) =>
    env[key] ?? fallback;

describe('buildDatabaseOptions', () => {
  it('defaults to TLS on and synchronize off: the schema comes from migrations', () => {
    const options = buildDatabaseOptions(from({}));

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('reads connection settings and the opt-outs from the environment', () => {
    const options = buildDatabaseOptions(
      from({
        DB_HOST: 'db.example.com',
        DB_PORT: '6543',
        DB_SSL: 'false',
        DB_SYNCHRONIZE: 'true',
        DB_SLOW_QUERY_MS: '150',
      }),
    );

    expect(options).toMatchObject({
      host: 'db.example.com',
      port: 6543,
      ssl: false,
      synchronize: true,
      maxQueryExecutionTime: 150,
    });
  });
});

describe('DatabaseLogger', () => {
  it('never prints bound parameters for a slow query', () => {
    const logger = new DatabaseLogger(false);
    const warn = jest
      .spyOn(
        (logger as unknown as { logger: { warn: () => void } }).logger,
        'warn',
      )
      .mockImplementation(() => undefined);

    logger.logQuerySlow(
      420,
      'INSERT INTO users (email, password) VALUES ($1, $2)',
    );
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]);

    expect(message).toContain('420 ms');
    expect(message).not.toMatch(/PARAMETERS|@example\.com|\$2b\$/);
  });

  it('only logs every query when explicitly enabled', () => {
    const quiet = new DatabaseLogger(false);
    const verbose = new DatabaseLogger(true);
    const quietLog = jest
      .spyOn(
        (quiet as unknown as { logger: { log: () => void } }).logger,
        'log',
      )
      .mockImplementation(() => undefined);
    const verboseLog = jest
      .spyOn(
        (verbose as unknown as { logger: { log: () => void } }).logger,
        'log',
      )
      .mockImplementation(() => undefined);

    quiet.logQuery('SELECT 1', []);
    verbose.logQuery('SELECT 1', []);
    expect(quietLog).not.toHaveBeenCalled();
    expect(verboseLog).toHaveBeenCalledTimes(1);
  });
});
