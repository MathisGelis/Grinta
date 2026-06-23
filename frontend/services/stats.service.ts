import { api } from "./api";
import { TokenService } from "./token.service";

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
  delta: Record<string, { current: number; previous: number; change: number; changePct: number }>;
}

export interface Consistency {
  totalWorkouts: number;
  totalTrainingDays: number;
  currentStreakDays: number;
  longestStreakDays: number;
  averageWorkoutsPerWeek: number;
  weeklyActivity: { weekStart: string; workoutCount: number }[];
}

export const StatsService = {
  async getSummary(period: "week" | "month" = "week"): Promise<PeriodSummary> {
    const token = await TokenService.get();
    return api.get<PeriodSummary>(`/stats/summary?period=${period}`, token ?? undefined);
  },

  async getConsistency(): Promise<Consistency> {
    const token = await TokenService.get();
    return api.get<Consistency>("/stats/consistency", token ?? undefined);
  },
};
