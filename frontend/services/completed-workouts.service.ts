import { api } from "./api";
import type { Badge } from "./badges.service";

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
