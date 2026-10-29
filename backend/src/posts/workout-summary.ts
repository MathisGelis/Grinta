import { EntityManager } from 'typeorm';
import type { SetPair } from '../workouts/entities/completed-workout.entity';

/**
 * What a feed shows of the workout behind a post: each exercise with its
 * number of sets and best set, and the totals of the session. The sets
 * themselves stay in the workout detail, which keeps feed pages light.
 */
export interface FeedExerciseSummary {
  exerciseId: string;
  name: string;
  sets: number;
  /** Heaviest set, the one with most reps between equal weights. */
  bestSet: SetPair | null;
}

export interface FeedWorkoutStats {
  durationSeconds: number;
  /** Sum of reps x weight (kg), as in GET /stats/workout/:id. */
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  /** Personal records the workout set (badges). */
  recordsCount: number;
}

export interface FeedWorkoutSummary {
  exercises: FeedExerciseSummary[];
  stats: FeedWorkoutStats;
}

type ExerciseRow = {
  workoutId: string;
  exerciseId: string;
  name: string;
  sets: SetPair[] | null;
};

/** The heaviest set, and between equal weights the one with most reps. */
export function bestSetOf(sets: SetPair[] | null | undefined): SetPair | null {
  let best: SetPair | null = null;

  for (const set of sets ?? [])
    if (
      !best ||
      set.weight > best.weight ||
      (set.weight === best.weight && set.reps > best.reps)
    )
      best = set;
  return best && { reps: best.reps, weight: best.weight };
}

/**
 * Summary of one workout from its exercise rows. Counts every logged set,
 * the same way the stats of a workout do, so the two always agree.
 */
export function summarizeWorkout(
  rows: Array<Omit<ExerciseRow, 'workoutId'>>,
  durationSeconds: number,
  recordsCount: number,
): FeedWorkoutSummary {
  const sets = rows.flatMap((r) => r.sets ?? []);
  const volume = sets.reduce((acc, s) => acc + s.reps * s.weight, 0);

  return {
    exercises: rows.map((r) => ({
      exerciseId: r.exerciseId,
      name: r.name,
      sets: r.sets?.length ?? 0,
      bestSet: bestSetOf(r.sets),
    })),
    stats: {
      durationSeconds,
      totalVolume: Math.round(volume * 100) / 100,
      totalSets: sets.length,
      totalReps: sets.reduce((acc, s) => acc + s.reps, 0),
      recordsCount,
    },
  };
}

/**
 * Adds `exercises` and `stats` to feed rows that carry a `workoutId`, with
 * two queries for the whole page rather than one per post.
 */
export async function withWorkoutSummaries<T extends { workoutId: string }>(
  manager: EntityManager,
  rows: T[],
): Promise<Array<T & FeedWorkoutSummary>> {
  const ids = [...new Set(rows.map((r) => r.workoutId).filter(Boolean))];
  const empty = summarizeWorkout([], 0, 0);

  if (!ids.length) return rows.map((row) => ({ ...row, ...empty }));
  const [exercises, workouts]: [
    ExerciseRow[],
    Array<{ id: string; durationSeconds: number; recordsCount: number }>,
  ] = await Promise.all([
    manager.query(
      `SELECT cwe."workoutId", e.id AS "exerciseId", e.name, cwe.sets
         FROM completed_workout_exercises cwe
         JOIN exercises e ON e.id = cwe."exerciseId"
        WHERE cwe."workoutId" = ANY($1)`,
      [ids],
    ),
    manager.query(
      `SELECT w.id, w."totalDurationSeconds" AS "durationSeconds",
              (SELECT COUNT(*)::int FROM badges b WHERE b."workoutId" = w.id)
                AS "recordsCount"
         FROM completed_workouts w
        WHERE w.id = ANY($1)`,
      [ids],
    ),
  ]);
  const byWorkout = new Map<string, ExerciseRow[]>();

  for (const row of exercises) {
    const list = byWorkout.get(row.workoutId) ?? [];

    list.push(row);
    byWorkout.set(row.workoutId, list);
  }
  const summaries = new Map(
    workouts.map((w) => [
      w.id,
      summarizeWorkout(
        byWorkout.get(w.id) ?? [],
        w.durationSeconds,
        w.recordsCount,
      ),
    ]),
  );

  return rows.map((row) => ({
    ...row,
    ...(summaries.get(row.workoutId) ?? empty),
  }));
}
