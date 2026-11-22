import { Logger } from '@nestjs/common';
import { DatabaseLogger } from './database.logger';

describe('DatabaseLogger', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints migration progress where it is asked to, the migration CLI', () => {
    new DatabaseLogger(false, true).logSchemaBuild(
      'Migration RepairSchemaDrift1792605872865 has been executed successfully.',
    );

    expect(log).toHaveBeenCalledWith(
      'Migration RepairSchemaDrift1792605872865 has been executed successfully.',
    );
  });

  it('keeps schema comparisons out of the API logs', () => {
    new DatabaseLogger(false).logSchemaBuild('new columns added: description');

    expect(log).not.toHaveBeenCalled();
  });

  it('never prints query parameters unless every query is logged', () => {
    new DatabaseLogger(false).logQuery('INSERT INTO users', ['secret']);

    expect(log).not.toHaveBeenCalled();
  });
});
