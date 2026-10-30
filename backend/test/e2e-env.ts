import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// The e2e tests write to the database they are given: users, workouts,
// posts. They refuse to start unless DB_NAME is set in the environment and
// names a test database, so that a .env pointing at production can never be
// picked up by mistake (ConfigModule only fills what the environment lacks).
const name = process.env.DB_NAME;

if (!name || !/e2e|test/i.test(name))
  throw new Error(
    'Set DB_NAME to a disposable database whose name contains "e2e" or "test", e.g. DB_NAME=grinta_e2e npm run test:e2e',
  );

process.env.JWT_SECRET ??=
  'e2e-secret-that-is-long-enough-for-the-check-0123456789';
process.env.PHOTOS_STORAGE ??= 'local';
process.env.UPLOADS_DIR ??= mkdtempSync(join(tmpdir(), 'grinta-e2e-'));
process.env.MAIL_TRANSPORT ??= 'log';
