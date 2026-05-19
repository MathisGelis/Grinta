import { api } from "./api";
import { TokenService } from "./token.service";

export interface CompletedWorkout {
  id: string;
  title: string;
  description?: string;
  completionDate: string;
  totalDurationSeconds: number;
  totalExercises: number;
}

export interface PlannedWorkout {
  id: string;
  title: string;
  description?: string;
  totalExercises: number;
}

export interface ExerciseDetail {
  id: string;
  name: string;
  equipment_type: string;
  image_url?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise: ExerciseDetail;
  sets?: { reps: number; weight: number }[];
  plannedRestSeconds?: number;
}

export interface PlannedWorkoutDetail {
  workout: {
    id: string;
    title: string;
    description?: string;
    exercises: WorkoutExercise[];
    createdAt: string;
  };
  totalExercises: number;
}

export interface Programme {
  id: string;
  title: string;
  weekNumber: number;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}

export interface CreateSetDto {
  reps: number;
  weight: number;
}

export interface CreateWorkoutExerciseDto {
  exerciseId: string;
  sets?: CreateSetDto[];
  plannedRestSeconds?: number;
}

export interface CreatePlannedWorkoutDto {
  title: string;
  description?: string;
  exercises: CreateWorkoutExerciseDto[];
}

async function getToken(): Promise<string | null> {
  return TokenService.get();
}

export const WorkoutService = {
  async getCompleted(): Promise<CompletedWorkout[]> {
    const token = await getToken();
    if (!token) return [];
    return api.get<CompletedWorkout[]>("/workouts/completed", token);
  },

  async getPlanned(): Promise<PlannedWorkout[]> {
    const token = await getToken();
    if (!token) return [];
    return api.get<PlannedWorkout[]>("/workouts/planned", token);
  },

  async getPlannedDetail(id: string): Promise<PlannedWorkoutDetail | null> {
    const token = await getToken();
    if (!token) return null;
    return api.get<PlannedWorkoutDetail>(`/workouts/planned/${id}`, token);
  },

  async getProgrammes(): Promise<Programme[]> {
    const token = await getToken();
    if (!token) return [];
    return api.get<Programme[]>("/programmes", token);
  },

  async getExercises(): Promise<ExerciseDetail[]> {
    const token = await getToken();
    if (!token) return [];
    return api.get<ExerciseDetail[]>("/exercises", token);
  },

  async createPlanned(dto: CreatePlannedWorkoutDto): Promise<{ id: string }> {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    return api.post<{ id: string }>("/workouts/planned", dto, token);
  },

  async deleteCompleted(id: string): Promise<void> {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    await api.delete(`/workouts/completed/${id}`, token);
  },

  async deletePlanned(id: string): Promise<void> {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    await api.delete(`/workouts/planned/${id}`, token);
  },
};
