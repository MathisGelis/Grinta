import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { seedExercises } from '../src/exercise/seed/exercise.seed';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

/** The whole API, configured as in production, on the e2e database. */
export async function createE2eApp(
  override: (builder: TestingModuleBuilder) => TestingModuleBuilder = (b) => b,
  extraImports: ModuleMetadata['imports'] = [],
): Promise<NestExpressApplication> {
  const moduleRef = await override(
    Test.createTestingModule({ imports: [AppModule, ...extraImports] }),
  ).compile();
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

/** Loads the real exercise catalogue once, as `npm run seed` does. */
export async function ensureCatalogue(app: NestExpressApplication) {
  const dataSource = app.get(DataSource);
  const [{ count }] = await dataSource.query<Array<{ count: number }>>(
    'SELECT COUNT(*)::int AS count FROM exercises',
  );

  if (!count) await seedExercises(dataSource);
}

export async function exerciseId(app: NestExpressApplication, name: string) {
  const [row] = await app
    .get(DataSource)
    .query<
      Array<{ id: string }>
    >('SELECT id FROM exercises WHERE name = $1', [name]);

  if (!row) throw new Error(`Exercise ${name} missing from the catalogue`);
  return row.id;
}

/** A workout of the user, published as a post; returns the post id. */
export async function createPost(
  app: NestExpressApplication,
  user: TestUser,
  exercise: string,
): Promise<string> {
  const workout = await http(app)
    .post('/workouts/completed')
    .auth(user.token, { type: 'bearer' })
    .send({
      title: 'Séance',
      completionDate: new Date().toISOString(),
      totalDurationSeconds: 1800,
      exercises: [{ exerciseId: exercise, sets: [{ reps: 8, weight: 50 }] }],
    })
    .expect(201);
  const post = await http(app)
    .post('/posts')
    .auth(user.token, { type: 'bearer' })
    .send({ workoutId: (workout.body as { id: string }).id })
    .expect(201);

  return (post.body as { id: string }).id;
}
