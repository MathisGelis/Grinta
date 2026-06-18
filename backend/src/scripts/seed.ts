import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedExercises } from '../exercise/seed/exercise.seed';
import { seedUsernames } from '../users/seed/users.seed';
import { Exercise } from '../exercise/entities/exercise.entity';
import { UserExerciseStats } from '../exercise/entities/user-exercise-stats.entity';
import { User } from '../users/entities/users.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Exercise, UserExerciseStats],
  synchronize: false,
});

async function run() {
  await dataSource.initialize();
  console.log('Database connected');

  await seedExercises(dataSource);
  await seedUsernames(dataSource);

  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
