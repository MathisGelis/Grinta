import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';

describe('AppController', () => {
  const withDatabase = (query: () => Promise<unknown>) =>
    new AppController({ query } as unknown as DataSource);

  it('answers on /', () => {
    expect(withDatabase(() => Promise.resolve([])).root()).toEqual({
      status: 'ok',
    });
  });

  it('reports the database up', async () => {
    await expect(
      withDatabase(() => Promise.resolve([{ '?column?': 1 }])).health(),
    ).resolves.toEqual({
      status: 'ok',
      database: 'ok',
    });
  });

  it('answers 503 when the database is unreachable', async () => {
    await expect(
      withDatabase(() => Promise.reject(new Error('ECONNREFUSED'))).health(),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
