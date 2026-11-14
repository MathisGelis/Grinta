import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { ExerciseStatsService } from '../exercise/exercise-stats.service';

/**
 * Builds the per-exercise stats of every user from the workouts completed
 * before the stats existed. Safe to run again: each run recomputes from the
 * history. It does not award badges for past workouts, badges start with the
 * first workout saved after deployment.
 */
async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const dataSource = app.get(DataSource);
  const stats = app.get(ExerciseStatsService);
  const users: Array<{ userId: string; exerciseIds: string[] }> =
    await dataSource.query(
      `SELECT w."userId" AS "userId",
              array_agg(DISTINCT e."exerciseId"::text) AS "exerciseIds"
         FROM completed_workouts w
         JOIN completed_workout_exercises e ON e."workoutId" = w.id
        GROUP BY w."userId"`,
    );
  let exercises = 0;

  for (const { userId, exerciseIds } of users) {
    await dataSource.transaction((manager) =>
      stats.recompute(manager, userId, exerciseIds),
    );
    exercises += exerciseIds.length;
  }
  console.log(
    `Stats rebuilt for ${users.length} users and ${exercises} exercises`,
  );
  await app.close();
}

run().catch((err) => {
  console.error('Backfill failed', err);
  process.exit(1);
});
