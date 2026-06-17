import { api } from "./api";

export interface CompletedSet {
  reps: number;
  weight: number;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
  timerSeconds: number;
}

export interface CompletedWorkoutRequest {
  title: string;
  completionDate: string;
  totalDurationSeconds: number;
  description: string;
  exercises: CompletedExercise[];
}

/**
 * Enregistre un workout complété
 * @param workoutData - Données du workout complété
 * @param token - Token d'authentification
 * @returns Réponse du serveur
 */
export async function createCompletedWorkout(
  workoutData: CompletedWorkoutRequest,
  token?: string
) {
  try {
    const response = await api.post<any>(
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
