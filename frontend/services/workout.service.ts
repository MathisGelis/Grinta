import { api } from "./api";
import { TokenService } from "./token.service";

export interface CompletedWorkout {
  id: string;
  title: string;
  completionDate: string;
  totalDurationSeconds: number;
  exercises: any[];
}

export interface PlannedWorkout {
  id: string;
  title: string;
  exercises: any[];
}

export const WorkoutService = {
  async getCompleted(): Promise<CompletedWorkout[]> {
    const token = await TokenService.get();
    return api.get<CompletedWorkout[]>("/workouts/completed", token ?? undefined);
  },

  async getPlanned(): Promise<PlannedWorkout[]> {
    const token = await TokenService.get();
    return api.get<PlannedWorkout[]>("/workouts/planned", token ?? undefined);
  },

  async deleteCompleted(id: string): Promise<void> {
    const token = await TokenService.get();
    return api.delete(`/workouts/completed/${id}`, token ?? undefined);
  },
};
