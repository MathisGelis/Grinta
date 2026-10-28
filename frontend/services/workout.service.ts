import { api } from "./api";
import { TokenService } from "./token.service";

export interface CompletedWorkout {
  id: string;
  title: string;
  completionDate: string;
  totalDurationSeconds: number;
  exercises: any[];
}

export interface CompletedWorkoutDetail {
  workout: {
    id: string;
    title: string;
    description?: string | null;
    completionDate: string;
    totalDurationSeconds: number;
    exercises: {
      id: string;
      exercise?: { id: string; name: string };
      sets?: { reps: number; weight: number }[] | null;
      timerSeconds?: number | null;
    }[];
  };
  totalExercises: number;
}

export interface UpdateCompletedWorkoutRequest {
  title?: string;
  description?: string;
  completionDate?: string;
  totalDurationSeconds?: number;
  exercises?: {
    exerciseId: string;
    sets?: { reps: number; weight: number }[];
    timerSeconds?: number;
  }[];
}

export const WorkoutService = {
  async getCompleted(): Promise<CompletedWorkout[]> {
    const token = await TokenService.get();
    return api.get<CompletedWorkout[]>("/workouts/completed", token ?? undefined);
  },

  async deleteCompleted(id: string): Promise<void> {
    const token = await TokenService.get();
    return api.delete(`/workouts/completed/${id}`, token ?? undefined);
  },

  async getCompletedById(id: string): Promise<CompletedWorkoutDetail> {
    const token = await TokenService.get();
    return api.get<CompletedWorkoutDetail>(`/workouts/completed/${id}`, token ?? undefined);
  },

  async updateCompleted(id: string, data: UpdateCompletedWorkoutRequest) {
    const token = await TokenService.get();
    return api.patch(`/workouts/completed/${id}`, data, token ?? undefined);
  },
};
