import { NestExpressApplication } from '@nestjs/platform-express';
import { createE2eApp, http } from './e2e-utils';

describe('Health (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(() => app.close());

  it('GET / answers 200 without a token', () =>
    http(app).get('/').expect(200).expect({ status: 'ok' }));

  it('GET /health checks the database', () =>
    http(app)
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', database: 'ok' }));

  it('is never rate limited', async () => {
    for (let i = 0; i < 70; i++) await http(app).get('/health').expect(200);
  });
});
