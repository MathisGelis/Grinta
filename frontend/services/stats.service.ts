import { api } from "./api";
import { TokenService } from "./token.service";

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
}

export const StatsService = {
  async getSummary(period: StatsPeriod = "week"): Promise<PeriodSummary> {
    const token = await TokenService.get();
    return api.get<PeriodSummary>(`/stats/summary?period=${period}`, token ?? undefined);
  },

  async getConsistency(): Promise<Consistency> {
    const token = await TokenService.get();
    return api.get<Consistency>("/stats/consistency", token ?? undefined);
  },

  async getMuscleDistribution(period: StatsPeriod = "week"): Promise<MuscleDistribution> {
    const token = await TokenService.get();
    return api.get<MuscleDistribution>(`/stats/muscle-distribution?period=${period}`, token ?? undefined);
  },

  async getBalance(period: StatsPeriod = "week"): Promise<TrainingBalance> {
    const token = await TokenService.get();
    return api.get<TrainingBalance>(`/stats/balance?period=${period}`, token ?? undefined);
  },

  async getMuscleFrequency(): Promise<MuscleFrequency> {
    const token = await TokenService.get();
    return api.get<MuscleFrequency>("/stats/muscle-frequency", token ?? undefined);
  },

  async getWorkoutStats(workoutId: string): Promise<WorkoutStats> {
    const token = await TokenService.get();
    return api.get<WorkoutStats>(`/stats/workout/${workoutId}`, token ?? undefined);
  },
};
