import { Injectable } from '@nestjs/common';
import {
  CompletedWorkout,
  CompletedWorkoutExercise,
  SetPair,
} from '../workouts/entities/completed-workout.entity';
import { DetailedMuscleGroup } from '../exercise/enums/detailed-muscle.enum';
import {
  DEFAULT_MET,
  MET_BY_EXERCISE_TYPE,
  SECONDARY_MUSCLE_WEIGHT,
} from './constants/met-values';
import { MuscleRecoveryStatus } from './dto/stats-response.dto';
import { epley1RM, round, sum } from './utils/stats.util';

export type MuscleContribution = {
  muscle: DetailedMuscleGroup;
  weight: number;
};

@Injectable()
export class StatsCalculatorService {
  computeExerciseStats(
    cwe: CompletedWorkoutExercise,
    durationSeconds: number,
    bodyWeightKg: number,
  ) {
    const sets: SetPair[] = cwe.sets ?? [];
    const reps = sum(sets, (s) => s.reps);
    const volume = sum(sets, (s) => s.reps * s.weight);
    const heaviestWeight = sets.length
      ? Math.max(...sets.map((s) => s.weight))
      : 0;
    const estimatedOneRepMax = sets.length
      ? Math.max(...sets.map((s) => epley1RM(s.weight, s.reps)))
      : 0;

    return {
      exerciseId: cwe.exercise?.id,
      name: cwe.exercise?.name,
      primaryMuscle: cwe.exercise?.primary_muscle,
      sets: sets.length,
      reps,
      volume: round(volume),
      heaviestWeight,
      estimatedOneRepMax: round(estimatedOneRepMax),
      estimatedCalories: round(
        this.metFor(cwe) * bodyWeightKg * (durationSeconds / 3600),
      ),
      durationSeconds: Math.round(durationSeconds),
    };
  }

  distributeDuration(workout: CompletedWorkout): number[] {
    const exercises = workout.exercises ?? [];
    const known = sum(exercises, (e) => e.timerSeconds ?? 0);
    const untimed = exercises.filter((e) => e.timerSeconds == null).length;
    const remaining = Math.max(workout.totalDurationSeconds - known, 0);
    const share = untimed > 0 ? remaining / untimed : 0;

    return exercises.map((e) => e.timerSeconds ?? share);
  }

  workoutVolume(workout: CompletedWorkout): number {
    return sum(workout.exercises ?? [], (cwe) =>
      sum(cwe.sets ?? [], (s) => s.reps * s.weight),
    );
  }

  aggregateTotals(workouts: CompletedWorkout[], bodyWeightKg: number) {
    const durationSeconds = sum(workouts, (w) => w.totalDurationSeconds);

    return {
      workouts: workouts.length,
      durationSeconds,
      durationMinutes: round(durationSeconds / 60),
      sets: sum(workouts, (w) =>
        sum(w.exercises ?? [], (e) => e.sets?.length ?? 0),
      ),
      reps: sum(workouts, (w) =>
        sum(w.exercises ?? [], (e) => sum(e.sets ?? [], (s) => s.reps)),
      ),
      volume: round(sum(workouts, (w) => this.workoutVolume(w))),
      calories: round(
        sum(workouts, (w) => this.workoutCalories(w, bodyWeightKg)),
      ),
      avgWorkoutDurationSeconds: workouts.length
        ? Math.round(durationSeconds / workouts.length)
        : 0,
    };
  }

  effectiveSetsByMuscle(workouts: CompletedWorkout[]) {
    const perMuscle = new Map<DetailedMuscleGroup, number>();
    let total = 0;

    for (const workout of workouts) {
      for (const cwe of workout.exercises ?? []) {
        const setCount = cwe.sets?.length ?? 0;

        if (!setCount || !cwe.exercise) continue;
        for (const { muscle, weight } of this.muscleContributions(cwe)) {
          const credit = setCount * weight;

          perMuscle.set(muscle, (perMuscle.get(muscle) ?? 0) + credit);
          total += credit;
        }
      }
    }
    return { perMuscle, total };
  }

  muscleContributions(cwe: CompletedWorkoutExercise): MuscleContribution[] {
    if (!cwe.exercise) return [];
    const contributions: MuscleContribution[] = [
      { muscle: cwe.exercise.primary_muscle, weight: 1 },
    ];

    for (const m of cwe.exercise.secondary_muscles ?? [])
      contributions.push({ muscle: m, weight: SECONDARY_MUSCLE_WEIGHT });
    return contributions;
  }

  collectMuscles(exercises: CompletedWorkoutExercise[]): DetailedMuscleGroup[] {
    const muscles = new Set<DetailedMuscleGroup>();

    for (const cwe of exercises) {
      if (!cwe.exercise) continue;
      muscles.add(cwe.exercise.primary_muscle);
      for (const m of cwe.exercise.secondary_muscles ?? []) muscles.add(m);
    }
    return [...muscles];
  }

  recoveryStatus(daysSince: number | null): MuscleRecoveryStatus {
    if (daysSince === null) return 'never';
    if (daysSince <= 1) return 'recovering';
    if (daysSince <= 6) return 'ready';
    return 'overdue';
  }

  balanceInsights(
    pushPull: number | null,
    upperLower: number | null,
    lowerSets: number,
  ): string[] {
    const insights: string[] = [];

    if (pushPull === null)
      insights.push('Not enough pulling volume to assess push/pull balance.');
    else if (pushPull > 1.3)
      insights.push(
        `Push volume is ${pushPull}x your pull volume — consider adding pulling work.`,
      );
    else if (pushPull < 0.77)
      insights.push(
        `Pull volume outweighs push (ratio ${pushPull}) — consider adding pushing work.`,
      );
    else insights.push(`Push/pull balance looks healthy (ratio ${pushPull}).`);

    if (lowerSets === 0)
      insights.push('No lower-body volume logged this period.');
    else if (upperLower !== null && upperLower > 2)
      insights.push(
        `Upper-body volume is ${upperLower}x lower-body — consider more leg work.`,
      );
    else if (upperLower !== null && upperLower < 0.5)
      insights.push(
        `Lower-body volume dominates (ratio ${upperLower}) — upper body may be undertrained.`,
      );
    return insights;
  }

  private metFor(cwe: CompletedWorkoutExercise): number {
    return (
      MET_BY_EXERCISE_TYPE[
        String(cwe.exercise?.exercise_type ?? '').toLowerCase()
      ] ?? DEFAULT_MET
    );
  }

  private workoutCalories(
    workout: CompletedWorkout,
    bodyWeightKg: number,
  ): number {
    const durations = this.distributeDuration(workout);

    return (workout.exercises ?? []).reduce(
      (acc, cwe, i) =>
        acc + this.metFor(cwe) * bodyWeightKg * (durations[i] / 3600),
      0,
    );
  }
}
