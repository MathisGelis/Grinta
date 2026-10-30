import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { seedExercises } from '../src/exercise/seed/exercise.seed';
import { FixExerciseNames1792605872871 } from '../src/migrations/1792605872871-FixExerciseNames';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  http,
  TestUser,
} from './e2e-utils';

describe('Exercise catalogue (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'catalogue');
    dataSource = app.get(DataSource);
  });

  afterAll(() => app.close());

  const idOf = async (name: string) =>
    (
      await dataSource.query<Array<{ id: string }>>(
        'SELECT id FROM exercises WHERE name = $1',
        [name],
      )
    )[0]?.id;

  it('names the Bayesian curl correctly', async () => {
    expect(await idOf('Bayesian Curl (Cable)')).toBeDefined();
    expect(await idOf('Baesyan Curl (Cable)')).toBeUndefined();
  });

  it('fixes an old database in place, migration and seed alike', async () => {
    const id = await idOf('Bayesian Curl (Cable)');
    const misspell = () =>
      dataSource.query(
        `UPDATE exercises SET name = 'Baesyan Curl (Cable)' WHERE id = $1`,
        [id],
      );
    const runner = dataSource.createQueryRunner();
    const migration = new FixExerciseNames1792605872871();

    await misspell();
    await migration.up(runner);
    expect(await idOf('Bayesian Curl (Cable)')).toBe(id);

    await migration.down(runner);
    expect(await idOf('Baesyan Curl (Cable)')).toBe(id);
    await migration.up(runner);
    await runner.release();

    await misspell();
    await seedExercises(dataSource);
    expect(await idOf('Bayesian Curl (Cable)')).toBe(id);
    expect(await idOf('Baesyan Curl (Cable)')).toBeUndefined();
  });

  it('answers 304 to an ETag that is still current', async () => {
    const first = await http(app)
      .get('/exercises')
      .auth(user.token, { type: 'bearer' })
      .expect(200);
    const etag = first.headers.etag;

    expect(etag).toBeTruthy();
    expect(first.headers['cache-control']).toBe('private, no-cache');

    const again = await http(app)
      .get('/exercises')
      .auth(user.token, { type: 'bearer' })
      .set('If-None-Match', etag)
      .expect(304);

    expect(again.text).toBeFalsy();
    await http(app)
      .get('/exercises')
      .auth(user.token, { type: 'bearer' })
      .set('If-None-Match', 'W/"stale"')
      .expect(200);
  });
});
