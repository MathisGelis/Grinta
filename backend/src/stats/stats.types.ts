import { DetailedMuscleGroup } from '../exercise/enums/detailed-muscle.enum';
import { SetPair } from '../workouts/entities/completed-workout.entity';

/**
 * Plain row shapes exchanged between the SQL reductions in StatsService and the
 * pure functions in StatsCalculatorService. Dates that represent a calendar
 * day are 'YYYY-MM-DD' strings so no time zone conversion can shift them.
 */

export interface ProgressionRow {
  day: string;
  workoutId: string;
  sets: SetPair[] | null;
}

export interface BestSetRow {
  exerciseId: string;
  name: string;
  primaryMuscle: DetailedMuscleGroup;
  reps: number;
  weight: number;
  achievedAt: Date;
}

export interface SessionVolumeRow {
  exerciseId: string;
  workoutId: string;
  volume: number;
  achievedAt: Date;
}

export interface BreakdownRow {
  type: string;
  exercises: number;
  sets: number;
  volume: number;
}

export interface HeatmapRow {
  day: string;
  workouts: number;
  durationSeconds: number;
}

export interface PeriodTotals {
  workouts: number;
  durationSeconds: number;
  sets: number;
  reps: number;
  volume: number;
  calories: number;
}
