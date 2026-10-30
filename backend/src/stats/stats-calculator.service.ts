import { Injectable } from '@nestjs/common';
import {
  CompletedWorkout,
  CompletedWorkoutExercise,
  SetPair,
} from '../workouts/entities/completed-workout.entity';
import { PlannedWorkout } from '../workouts/entities/planned-workout.entity';
import { DetailedMuscleGroup } from '../exercise/enums/detailed-muscle.enum';
import {
  COMPARED_METRICS,
  ON_TRACK_THRESHOLD_PCT,
} from './constants/comparison';
import {
  DEFAULT_MET,
  MET_BY_EXERCISE_TYPE,
  SECONDARY_MUSCLE_WEIGHT,
} from './constants/met-values';
import {
  ADHERENCE_RATING_THRESHOLDS,
  HEATMAP_MAX_LEVEL,
  TREND_FLAT_THRESHOLD_PCT,
  TREND_SAMPLE_SIZE,
} from './constants/progression';
import { ProgressionMetric } from './dto/progression-query.dto';
import {
  AdherenceDto,
  AdherenceExerciseDto,
  AdherenceExtraExerciseDto,
  AdherenceRating,
  AdherenceStatus,
  ComparedTotalsDto,
  ComparisonVerdict,
  ExerciseRecordsDto,
  HeatmapDayDto,
  MetricComparisonDto,
  MuscleRecoveryStatus,
  ProgressionPointDto,
  ProgressionSummaryDto,
  TypeSliceDto,
} from './dto/stats-response.dto';
import {
  BestSetRow,
  BreakdownRow,
  HeatmapRow,
  PeriodTotals,
  ProgressionRow,
  SessionVolumeRow,
} from './stats.types';
import {
  epley1RM,
  longestStreak,
  percentChange,
  round,
  sum,
} from './utils/stats.util';

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

  /** Muscles an exercise works, from a completed or a planned workout. */
  muscleContributions(
    cwe: Pick<CompletedWorkoutExercise, 'exercise'>,
  ): MuscleContribution[] {
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

  // -------------------------------------------------------------------------
  // Progression
  // -------------------------------------------------------------------------

  /**
   * One point per training day for a single exercise. Only sets with a positive
   * weight and positive reps count, a bodyweight set has no load to track.
   */
  progressionPoints(
    rows: ProgressionRow[],
    metric: ProgressionMetric,
  ): ProgressionPointDto[] {
    const days = new Map<
      string,
      { sets: SetPair[]; workoutIds: Set<string> }
    >();

    for (const row of rows) {
      const valid = (row.sets ?? []).filter(isLoadedSet);

      if (!valid.length) continue;
      const day = days.get(row.day) ?? { sets: [], workoutIds: new Set() };

      day.sets.push(...valid);
      day.workoutIds.add(row.workoutId);
      days.set(row.day, day);
    }

    return [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { sets, workoutIds }]) => {
        const best = bestEstimatedSet(sets);
        const value =
          metric === ProgressionMetric.VOLUME
            ? sum(sets, (s) => s.reps * s.weight)
            : epley1RM(best.weight, best.reps);

        return {
          date,
          value: round(value),
          sets: sets.length,
          bestSet: { reps: best.reps, weight: best.weight },
          workoutIds: [...workoutIds],
        };
      });
  }

  summarizeProgression(points: ProgressionPointDto[]): ProgressionSummaryDto {
    if (!points.length)
      return {
        points: 0,
        first: null,
        latest: null,
        best: null,
        change: 0,
        changePct: 0,
        trend: null,
      };
    const first = points[0];
    const latest = points[points.length - 1];
    const best = points.reduce((a, b) => (b.value > a.value ? b : a));

    return {
      points: points.length,
      first,
      latest,
      best,
      change: round(latest.value - first.value),
      changePct: percentChange(latest.value, first.value),
      trend: this.progressionTrend(points),
    };
  }

  /**
   * Compares the average of the earliest points with the average of the latest
   * ones rather than two single days, so one bad session does not flip it.
   */
  progressionTrend(
    points: ProgressionPointDto[],
  ): 'up' | 'down' | 'flat' | null {
    if (points.length < 2) return null;
    const window = Math.min(TREND_SAMPLE_SIZE, Math.floor(points.length / 2));
    const early = sum(points.slice(0, window), (p) => p.value) / window;
    const late = sum(points.slice(-window), (p) => p.value) / window;
    const change = percentChange(late, early);

    if (change > TREND_FLAT_THRESHOLD_PCT) return 'up';
    if (change < -TREND_FLAT_THRESHOLD_PCT) return 'down';
    return 'flat';
  }

  // -------------------------------------------------------------------------
  // Personal records
  // -------------------------------------------------------------------------

  /**
   * Builds the per-exercise records from the heaviest set of every rep count
   * (the SQL keeps one row per exercise and rep count). For a fixed rep count
   * the estimated 1RM only grows with the weight, so that reduction is enough
   * to find the best 1RM exactly.
   */
  exerciseRecords(
    bestSets: BestSetRow[],
    sessionVolumes: SessionVolumeRow[],
  ): ExerciseRecordsDto[] {
    const volumeByExercise = new Map(
      sessionVolumes.map((v) => [v.exerciseId, v]),
    );
    const byExercise = new Map<string, BestSetRow[]>();

    for (const row of bestSets) {
      if (!isLoadedSet(row)) continue;
      byExercise.set(row.exerciseId, [
        ...(byExercise.get(row.exerciseId) ?? []),
        row,
      ]);
    }

    return [...byExercise.values()]
      .map((rows) => {
        const oneRm = rows.reduce((a, b) => {
          const ea = epley1RM(a.weight, a.reps);
          const eb = epley1RM(b.weight, b.reps);

          return eb > ea || (eb === ea && b.achievedAt < a.achievedAt) ? b : a;
        });
        const heaviest = rows.reduce((a, b) => {
          if (b.weight !== a.weight) return b.weight > a.weight ? b : a;
          if (b.reps !== a.reps) return b.reps > a.reps ? b : a;
          return b.achievedAt < a.achievedAt ? b : a;
        });
        const volume = volumeByExercise.get(oneRm.exerciseId);

        return {
          exerciseId: oneRm.exerciseId,
          name: oneRm.name,
          primaryMuscle: oneRm.primaryMuscle,
          estimatedOneRepMax: {
            value: round(epley1RM(oneRm.weight, oneRm.reps)),
            weight: oneRm.weight,
            reps: oneRm.reps,
            achievedAt: oneRm.achievedAt,
          },
          heaviestWeight: {
            weight: heaviest.weight,
            reps: heaviest.reps,
            achievedAt: heaviest.achievedAt,
          },
          bestSessionVolume: volume
            ? {
                value: round(volume.volume),
                workoutId: volume.workoutId,
                achievedAt: volume.achievedAt,
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          b.estimatedOneRepMax.value - a.estimatedOneRepMax.value ||
          a.name.localeCompare(b.name),
      );
  }

  longestStreak(dayKeys: string[]): number {
    return longestStreak(dayKeys);
  }

  // -------------------------------------------------------------------------
  // Adherence
  // -------------------------------------------------------------------------

  /** Compares what was done in a session with what its plan prescribed. */
  computeAdherence(
    planned: PlannedWorkout,
    completed: CompletedWorkout,
  ): AdherenceDto {
    const plan = groupByExercise(planned.exercises ?? []);
    const done = groupByExercise(completed.exercises ?? []);
    const exercises: AdherenceExerciseDto[] = [];
    const totals = {
      exercisesPlanned: 0,
      exercisesCompleted: 0,
      exercisesPartial: 0,
      exercisesSkipped: 0,
      extraExercises: 0,
      setsPlanned: 0,
      setsCompleted: 0,
      volumePlanned: 0,
      volumeCompleted: 0,
    };

    for (const [exerciseId, target] of plan) {
      const actual = done.get(exerciseId);
      const plannedSets = target.sets.length;
      const completedSets = actual?.sets.length ?? 0;
      const plannedVolume = setVolume(target.sets);
      const completedVolume = setVolume(actual?.sets ?? []);
      const status = adherenceStatus(plannedSets, completedSets);
      const setAdherencePct = plannedSets
        ? round((Math.min(completedSets, plannedSets) / plannedSets) * 100, 1)
        : status === 'skipped'
          ? 0
          : 100;

      exercises.push({
        exerciseId,
        name: target.name,
        status,
        plannedSets,
        completedSets,
        plannedReps: sum(target.sets, (s) => s.reps),
        completedReps: sum(actual?.sets ?? [], (s) => s.reps),
        plannedVolume: round(plannedVolume),
        completedVolume: round(completedVolume),
        setAdherencePct,
        volumeAdherencePct: plannedVolume
          ? round((completedVolume / plannedVolume) * 100, 1)
          : null,
      });

      totals.exercisesPlanned++;
      if (status === 'completed' || status === 'exceeded')
        totals.exercisesCompleted++;
      else if (status === 'partial') totals.exercisesPartial++;
      else totals.exercisesSkipped++;
      totals.setsPlanned += plannedSets;
      totals.setsCompleted += Math.min(completedSets, plannedSets);
      totals.volumePlanned += plannedVolume;
      totals.volumeCompleted += completedVolume;
    }

    const extras: AdherenceExtraExerciseDto[] = [];

    for (const [exerciseId, actual] of done) {
      if (plan.has(exerciseId)) continue;
      extras.push({
        exerciseId,
        name: actual.name,
        sets: actual.sets.length,
        reps: sum(actual.sets, (s) => s.reps),
        volume: round(setVolume(actual.sets)),
      });
    }
    totals.extraExercises = extras.length;

    const score = totals.setsPlanned
      ? round((totals.setsCompleted / totals.setsPlanned) * 100, 1)
      : totals.exercisesPlanned
        ? round((totals.exercisesCompleted / totals.exercisesPlanned) * 100, 1)
        : null;

    return {
      completedWorkoutId: completed.id,
      plannedWorkoutId: planned.id,
      completedTitle: completed.title,
      plannedTitle: planned.title,
      score,
      rating: score === null ? null : adherenceRating(score),
      totals: {
        ...totals,
        volumePlanned: round(totals.volumePlanned),
        volumeCompleted: round(totals.volumeCompleted),
      },
      exercises,
      extras,
    };
  }

  // -------------------------------------------------------------------------
  // Comparison against the personal baseline
  // -------------------------------------------------------------------------

  /** Mean of every compared metric over a list of period totals. */
  averageTotals(totals: PeriodTotals[]): ComparedTotalsDto {
    const n = totals.length || 1;
    const mean = (pick: (t: PeriodTotals) => number) =>
      round(sum(totals, pick) / n);

    return {
      workouts: mean((t) => t.workouts),
      durationSeconds: mean((t) => t.durationSeconds),
      sets: mean((t) => t.sets),
      reps: mean((t) => t.reps),
      volume: mean((t) => t.volume),
      calories: mean((t) => t.calories),
    };
  }

  /**
   * Compares the period so far with the user's usual period. The baseline is
   * pro-rated by `elapsed` (the share of the current period already gone) so a
   * Tuesday is not judged against a full week. A completed period uses 1.
   */
  compareToBaseline(
    current: PeriodTotals,
    baseline: ComparedTotalsDto | null,
    elapsed: number,
  ): Record<string, MetricComparisonDto> {
    const result: Record<string, MetricComparisonDto> = {};

    for (const metric of COMPARED_METRICS) {
      const value = current[metric];

      if (!baseline) {
        result[metric] = {
          current: value,
          baselineAverage: null,
          expectedByNow: null,
          changePct: null,
          verdict: 'unknown',
        };
        continue;
      }
      const baselineAverage = baseline[metric];
      const expectedByNow = round(baselineAverage * elapsed);
      const changePct = percentChange(value, expectedByNow);

      result[metric] = {
        current: value,
        baselineAverage,
        expectedByNow,
        changePct,
        verdict: comparisonVerdict(changePct),
      };
    }
    return result;
  }

  comparisonInsights(
    comparison: Record<string, MetricComparisonDto>,
    periodsConsidered: number,
    periodLabel: string,
    elapsed: number,
  ): string[] {
    if (!periodsConsidered)
      return ['Not enough history yet to compare with your usual routine.'];
    const scope =
      elapsed < 1 ? `so far this ${periodLabel}` : `this ${periodLabel}`;
    const insights: string[] = [];

    for (const [metric, subject] of [
      ['workouts', 'Workouts are'],
      ['volume', 'Training volume is'],
    ] as const) {
      const entry = comparison[metric];

      if (entry.verdict === 'unknown' || entry.changePct === null) continue;
      const usual = `your usual ${periodLabel} (last ${periodsConsidered})`;

      insights.push(
        entry.verdict === 'on_track'
          ? `${subject} in line with ${usual} ${scope}.`
          : `${subject} ${Math.abs(entry.changePct)}% ${entry.verdict === 'above' ? 'above' : 'below'} ${usual} ${scope}.`,
      );
    }
    return insights;
  }

  // -------------------------------------------------------------------------
  // Workout type breakdown
  // -------------------------------------------------------------------------

  /** Turns grouped SQL rows into slices with their share of the period's sets. */
  breakdownSlices(rows: BreakdownRow[]): TypeSliceDto[] {
    const totalSets = sum(rows, (r) => r.sets);

    return rows
      .map((r) => ({
        type: r.type,
        exercises: r.exercises,
        sets: r.sets,
        volume: round(r.volume),
        percentageOfSets: totalSets ? round((r.sets / totalSets) * 100, 1) : 0,
      }))
      .sort((a, b) => b.sets - a.sets || a.type.localeCompare(b.type));
  }

  // -------------------------------------------------------------------------
  // Heatmap
  // -------------------------------------------------------------------------

  /**
   * Intensity of each active day from 1 to the maximum level, relative to the
   * longest day of the year. A day is active as soon as one workout is logged,
   * so it never gets level 0 (reserved for the days absent from the result).
   */
  heatmapDays(rows: HeatmapRow[]): HeatmapDayDto[] {
    const longest = Math.max(0, ...rows.map((r) => r.durationSeconds));

    return [...rows]
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((r) => ({
        date: r.day,
        workouts: r.workouts,
        durationSeconds: r.durationSeconds,
        level: longest
          ? Math.min(
              HEATMAP_MAX_LEVEL,
              Math.max(
                1,
                Math.ceil((r.durationSeconds / longest) * HEATMAP_MAX_LEVEL),
              ),
            )
          : 1,
      }));
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

// ---------------------------------------------------------------------------
// Helpers shared by the methods above
// ---------------------------------------------------------------------------

function isLoadedSet(set: { reps: number; weight: number }): boolean {
  return (
    Number.isFinite(set.reps) &&
    Number.isFinite(set.weight) &&
    set.reps > 0 &&
    set.weight > 0
  );
}

/** The set with the highest estimated 1RM, the earliest listed one on a tie. */
function bestEstimatedSet(sets: SetPair[]): SetPair {
  return sets.reduce((a, b) =>
    epley1RM(b.weight, b.reps) > epley1RM(a.weight, a.reps) ? b : a,
  );
}

function setVolume(sets: SetPair[]): number {
  return sum(sets, (s) => s.reps * s.weight);
}

/** Sets of the same exercise are merged, in order of first appearance. */
function groupByExercise(
  entries: Array<{
    exercise?: { id: string; name: string };
    sets?: SetPair[];
  }>,
): Map<string, { name: string; sets: SetPair[] }> {
  const groups = new Map<string, { name: string; sets: SetPair[] }>();

  for (const entry of entries) {
    if (!entry.exercise) continue;
    const group = groups.get(entry.exercise.id) ?? {
      name: entry.exercise.name,
      sets: [],
    };

    group.sets.push(...(entry.sets ?? []));
    groups.set(entry.exercise.id, group);
  }
  return groups;
}

function adherenceStatus(
  plannedSets: number,
  completedSets: number,
): AdherenceStatus {
  if (plannedSets === 0) return completedSets > 0 ? 'completed' : 'skipped';
  if (completedSets === 0) return 'skipped';
  if (completedSets < plannedSets) return 'partial';
  return completedSets > plannedSets ? 'exceeded' : 'completed';
}

function adherenceRating(score: number): AdherenceRating {
  if (score >= ADHERENCE_RATING_THRESHOLDS.full) return 'full';
  if (score >= ADHERENCE_RATING_THRESHOLDS.high) return 'high';
  if (score >= ADHERENCE_RATING_THRESHOLDS.partial) return 'partial';
  return 'low';
}

function comparisonVerdict(changePct: number): ComparisonVerdict {
  if (changePct > ON_TRACK_THRESHOLD_PCT) return 'above';
  if (changePct < -ON_TRACK_THRESHOLD_PCT) return 'below';
  return 'on_track';
}
