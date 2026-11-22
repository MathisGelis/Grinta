import { api } from "./api";
import { TokenService } from "./token.service";
import type { RealLifeComparison } from "@/utils/realLife";

export type StatsPeriod = "week" | "month";

export interface PeriodSummary {
  period: string;
  rangeStart: string;
  rangeEnd: string;
  current: {
    workouts: number;
    durationSeconds: number;
    sets: number;
    reps: number;
    volume: number;
    calories: number;
  };
  previous: {
    workouts: number;
    durationSeconds: number;
    sets: number;
    reps: number;
    volume: number;
    calories: number;
  };
  delta: Record<string, { current: number; previous: number; change: number; changePct: number | null }>;
}

export interface Consistency {
  totalWorkouts: number;
  totalTrainingDays: number;
  currentStreakDays: number;
  longestStreakDays: number;
  averageWorkoutsPerWeek: number;
  weeklyActivity: { weekStart: string; workoutCount: number }[];
}

export interface MuscleDistribution {
  period: string;
  totalWorkouts: number;
  totalEffectiveSets: number;
  distribution: { muscle: string; effectiveSets: number; percentage: number }[];
}

export interface BalanceGroup {
  name: string;
  effectiveSets: number;
  percentage: number;
}

export interface TrainingBalance {
  period: string;
  totalEffectiveSets: number;
  byCategory: BalanceGroup[];
  byRegion: BalanceGroup[];
  pushPullRatio: number | null;
  upperLowerRatio: number | null;
  insights: string[];
}

export type MuscleRecoveryStatus = "recovering" | "ready" | "overdue" | "never";

export interface MuscleFrequencyItem {
  muscle: string;
  lastTrained: string | null;
  daysSinceLastTrained: number | null;
  sessionsLast90Days: number;
  effectiveSetsLast7Days: number;
  effectiveSetsLast30Days: number;
  status: MuscleRecoveryStatus;
}

export interface MuscleFrequency {
  generatedAt: string;
  muscles: MuscleFrequencyItem[];
}

export interface WorkoutExerciseStats {
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  sets: number;
  reps: number;
  volume: number;
  heaviestWeight: number;
  estimatedOneRepMax: number;
  estimatedCalories: number;
  durationSeconds: number;
}

export interface WorkoutStats {
  workoutId: string;
  title: string;
  completionDate: string;
  totalDurationSeconds: number;
  estimatedCalories: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  fullDayLoad: number;
  workoutsCompletedThatDay: number;
  numberOfExercises: number;
  averageWeightPerSet: number;
  averageVolumePerSet: number;
  musclesWorked: string[];
  exercises: WorkoutExerciseStats[];
  realLifeComparison?: RealLifeComparison | null;
}

const withQuery = (path: string, params: Record<string, string | number | undefined>) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
};

export type ProgressionMetric = "volume" | "1rm";
export type ProgressionPeriod = "1m" | "3m" | "6m" | "1y" | "all";

export interface ProgressionPoint {
  date: string;
  value: number;
  trend?: number | null;
}

export interface Progression {
  exerciseId: string;
  metric: ProgressionMetric;
  period: ProgressionPeriod;
  points: ProgressionPoint[];
  [key: string]: unknown;
}

export interface HeatmapDay {
  date: string;
  level: 1 | 2 | 3 | 4;
  calories: number;
  [key: string]: unknown;
}

export interface Heatmap {
  year: number;
  days: HeatmapDay[];
  totalCalories: number;
  [key: string]: unknown;
}

/** Codes `insights` renvoyés par /stats/balance et /stats/comparisons (B-10), à traduire. */
export type InsightCode = string;

export interface Comparisons {
  period: StatsPeriod;
  elapsedPct: number;
  baseline: Record<string, unknown> | null;
  comparison: Record<string, { changePct: number | null; [key: string]: unknown }>;
  insights: InsightCode[];
  [key: string]: unknown;
}

export const StatsService = {
  async getSummary(period: StatsPeriod = "week", userId?: string): Promise<PeriodSummary> {
    const token = await TokenService.get();
    return api.get<PeriodSummary>(withQuery("/stats/summary", { period, userId }), token ?? undefined);
  },

  async getConsistency(userId?: string): Promise<Consistency> {
    const token = await TokenService.get();
    return api.get<Consistency>(withQuery("/stats/consistency", { userId }), token ?? undefined);
  },

  async getMuscleDistribution(period: StatsPeriod = "week", userId?: string): Promise<MuscleDistribution> {
    const token = await TokenService.get();
    return api.get<MuscleDistribution>(
      withQuery("/stats/muscle-distribution", { period, userId }),
      token ?? undefined,
    );
  },

  async getBalance(period: StatsPeriod = "week", userId?: string): Promise<TrainingBalance> {
    const token = await TokenService.get();
    return api.get<TrainingBalance>(withQuery("/stats/balance", { period, userId }), token ?? undefined);
  },

  async getMuscleFrequency(userId?: string): Promise<MuscleFrequency> {
    const token = await TokenService.get();
    return api.get<MuscleFrequency>(withQuery("/stats/muscle-frequency", { userId }), token ?? undefined);
  },

  async getWorkoutStats(workoutId: string): Promise<WorkoutStats> {
    const token = await TokenService.get();
    return api.get<WorkoutStats>(`/stats/workout/${workoutId}`, token ?? undefined);
  },

  async getProgression(
    exerciseId: string,
    metric: ProgressionMetric = "volume",
    period: ProgressionPeriod = "3m",
  ): Promise<Progression> {
    const token = await TokenService.get();
    return api.get<Progression>(
      withQuery("/stats/progression", { exerciseId, metric, period }),
      token ?? undefined,
    );
  },

  async getHeatmap(year?: number): Promise<Heatmap> {
    const token = await TokenService.get();
    return api.get<Heatmap>(withQuery("/stats/heatmap", { year }), token ?? undefined);
  },

  /** `date` : date locale AAAA-MM-JJ. */
  async getComparisons(period: StatsPeriod = "week", date?: string): Promise<Comparisons> {
    const token = await TokenService.get();
    return api.get<Comparisons>(withQuery("/stats/comparisons", { period, date }), token ?? undefined);
  },

  async getWorkoutTypeBreakdown(period: StatsPeriod = "week", date?: string) {
    const token = await TokenService.get();
    return api.get<Record<string, unknown>>(
      withQuery("/stats/workout-type-breakdown", { period, date }),
      token ?? undefined,
    );
  },

  async getAdherence(completedWorkoutId: string, plannedWorkoutId: string) {
    const token = await TokenService.get();
    return api.get<Record<string, unknown>>(
      withQuery("/stats/adherence", { completedWorkoutId, plannedWorkoutId }),
      token ?? undefined,
    );
  },
};
