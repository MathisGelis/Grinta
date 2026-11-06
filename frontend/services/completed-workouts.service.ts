import { api } from "./api";
import type { Badge } from "./badges.service";
import { TokenService } from "./token.service";
import type { Exercise } from "./exercises.service";

export interface CompletedSet {
  reps: number;
  weight: number;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
  timerSeconds: number;
}

interface CompletedWorkoutRequest {
  title: string;
  completionDate: string;
  totalDurationSeconds: number;
  description: string;
  exercises: CompletedExercise[];
}

/** Réponse de `POST` / `PATCH /workouts/completed` : la séance + les records battus. */
export interface SavedCompletedWorkout {
  id: string;
  title: string;
  badges?: Badge[];
}

export async function createCompletedWorkout(
  workoutData: CompletedWorkoutRequest,
  token?: string
): Promise<SavedCompletedWorkout> {
  try {
    const response = await api.post<SavedCompletedWorkout>(
      "/workouts/completed",
      workoutData,
      token
    );
    return response;
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du workout:", error);
    throw error;
  }
}

export interface CompletedWorkout {
  id: string;
  title: string;
  description?: string | null;
  completionDate: string;
  totalDurationSeconds: number;
  calories?: number;
  photoUrl?: string | null;
  photoThumbnailUrl?: string | null;
  totalExercises?: number;
  exercises?: any[];
}

export const COMPLETED_PAGE_SIZE = 20;

export interface CompletedWorkoutDetail {
  workout: {
    id: string;
    title: string;
    description?: string | null;
    completionDate: string;
    totalDurationSeconds: number;
    photoUrl?: string | null;
    photoThumbnailUrl?: string | null;
    exercises: {
      id: string;
      // Sans description, consignes ni photos : voir `GET /exercises/:id`.
      exercise?: Exercise;
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
  /**
   * Sans paramètre : tout l'historique. Avec `limit` (1–100) : une page, la
   * suivante s'obtient avec `before` = id de la dernière séance reçue.
   */
  async getCompleted(opts: { limit?: number; before?: string } = {}): Promise<CompletedWorkout[]> {
    const token = await TokenService.get();
    const query = new URLSearchParams();
    if (opts.limit) query.set("limit", String(opts.limit));
    if (opts.before) query.set("before", opts.before);
    const qs = query.toString();
    return api.get<CompletedWorkout[]>(
      `/workouts/completed${qs ? `?${qs}` : ""}`,
      token ?? undefined,
    );
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
    return api.patch<SavedCompletedWorkout>(`/workouts/completed/${id}`, data, token ?? undefined);
  },
};
