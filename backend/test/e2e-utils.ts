import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

/** The whole API, configured as in production, on the e2e database. */
export async function createE2eApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();

  configureApp(app);
  await app.init();
  return app;
}

export const http = (app: NestExpressApplication) =>
  request(app.getHttpServer());

let counter = 0;

export interface TestUser {
  id: string;
  email: string;
  uniqueName: string;
  password: string;
  token: string;
}

/**
 * Registers a fresh user through the API and signs a token for them the way
 * AuthService does, without going through the rate-limited login.
 */
export async function createUser(
  app: NestExpressApplication,
  prefix = 'user',
): Promise<TestUser> {
  const uniqueName = `${prefix}${Date.now() % 1_000_000}${counter++}`;
  const email = `${uniqueName}@e2e.example.com`;
  const password = 'Password123!';
  const res = await http(app)
    .post('/users/register')
    .send({ email, password, displayName: `E2E ${prefix}`, uniqueName })
    .expect(201);
  const id = (res.body as { id: string }).id;
  const token = app.get(JwtService).sign({ sub: id, email, uniqueName });

  return { id, email, uniqueName, password, token };
}
