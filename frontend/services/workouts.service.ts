import { api } from "./api";
import { saveItem, getItem } from "@/core/services/storage";
import { Exercise } from "./exercises.service";

export interface PlannedWorkout {
  id: string;
  title: string;
  description: string;
  totalExercises: number;
}

export interface fullPlannedWorkout extends PlannedWorkout {
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName?: string;
  sets: { reps: number; weight: number }[];
  plannedRestSeconds: number;
}

// Interface for API response
interface APIWorkoutExercise {
  id: string;
  exercise: {
    id: string;
    name: string;
    [key: string]: any;
  };
  sets: { reps: number; weight: number }[] | null;
  plannedRestSeconds: number | null;
}

interface APIWorkoutResponse {
  workout: {
    id: string;
    title: string;
    description: string;
    exercises: APIWorkoutExercise[];
    createdAt: string;
  };
  totalExercises: number;
}

export interface CreateWorkoutRequest {
  title: string;
  description: string;
  exercises: WorkoutExercise[];
}

export interface UpdateWorkoutRequest {
  title?: string;
  description?: string;
  exercises?: WorkoutExercise[];
}

// Cache key
const PLANNED_WORKOUTS_CACHE_KEY = "planned_workouts_cache";

/**
 * Récupère les workouts planifiés depuis l'API avec cache
 * @param token - Token d'authentification
 * @returns Liste des workouts planifiés
 */
export async function getPlannedWorkouts(
  token?: string
): Promise<PlannedWorkout[]> {
  try {
    const response = await api.get<PlannedWorkout[]>(
      "/workouts/planned",
      token
    );
    await saveItem(PLANNED_WORKOUTS_CACHE_KEY, JSON.stringify(response));
    return response;
  } catch (error) {
    console.log("Erreur lors de la récupération des workouts planifiés:", error);
    const cachedData = await getItem(PLANNED_WORKOUTS_CACHE_KEY);
    if (cachedData) {
      console.log("Utilisation des données en cache");
      return JSON.parse(cachedData);
    }

    return [];
  }
}

/**
 * Vide le cache des workouts planifiés
 */
export async function clearPlannedWorkoutsCache(): Promise<void> {
  try {
    const { removeItem } = await import("@/core/services/storage");
    await removeItem(PLANNED_WORKOUTS_CACHE_KEY);
  } catch (error) {
    console.error("Erreur lors du nettoyage du cache:", error);
  }
}

/**
 * Supprime un workout planifié via l'API
 * Met à jour également le cache
 * @param id - ID du workout à supprimer
 * @param token - Token d'authentification
 */
export async function deletePlannedWorkout(
  id: string,
  token?: string
): Promise<void> {
  try {
    // Appeler l'API de suppression
    await api.delete(`/workouts/planned/${id}`, token);

    // Mettre à jour le cache en supprimant le workout
    const cachedData = await getItem(PLANNED_WORKOUTS_CACHE_KEY);
    if (cachedData) {
      const workouts = JSON.parse(cachedData) as PlannedWorkout[];
      const updatedWorkouts = workouts.filter((w) => w.id !== id);
      await saveItem(
        PLANNED_WORKOUTS_CACHE_KEY,
        JSON.stringify(updatedWorkouts)
      );
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du workout:", error);
    throw error;
  }
}

/**
 * Crée un nouveau workout planifié via l'API
 * Met à jour le cache avec le nouveau workout
 * @param workoutData - Données du workout à créer
 * @param token - Token d'authentification
 * @returns Le workout créé
 */
export async function createPlannedWorkout(
  workoutData: CreateWorkoutRequest,
  token?: string
): Promise<PlannedWorkout> {
  try {
    // Appeler l'API de création
    const response = await api.post<PlannedWorkout>(
      "/workouts/planned",
      workoutData,
      token
    );

    // Ajouter le nouveau workout au cache
    const cachedData = await getItem(PLANNED_WORKOUTS_CACHE_KEY);
    if (cachedData) {
      const workouts = JSON.parse(cachedData) as PlannedWorkout[];
      workouts.push(response);
      await saveItem(
        PLANNED_WORKOUTS_CACHE_KEY,
        JSON.stringify(workouts)
      );
    } else {
      // Si pas de cache, créer un nouveau cache
      await saveItem(
        PLANNED_WORKOUTS_CACHE_KEY,
        JSON.stringify([response])
      );
    }

    return response;
  } catch (error) {
    console.error("Erreur lors de la création du workout:", error);
    throw error;
  }
}

/**
 * Met à jour un workout planifié via l'API
 * Met à jour également le cache
 * @param id - ID du workout à mettre à jour
 * @param workoutData - Données du workout à mettre à jour
 * @param token - Token d'authentification
 * @returns Le workout mis à jour
 */
export async function updatePlannedWorkout(
  id: string,
  workoutData: UpdateWorkoutRequest,
  token?: string
): Promise<PlannedWorkout> {
  try {
    // Appeler l'API de mise à jour (PATCH)
    const response = await api.patch<PlannedWorkout>(
      `/workouts/planned/${id}`,
      workoutData,
      token
    );

    // Mettre à jour le cache
    const cachedData = await getItem(PLANNED_WORKOUTS_CACHE_KEY);
    if (cachedData) {
      const workouts = JSON.parse(cachedData) as PlannedWorkout[];
      const updatedWorkouts = workouts.map((w) =>
        w.id === id ? response : w
      );
      await saveItem(
        PLANNED_WORKOUTS_CACHE_KEY,
        JSON.stringify(updatedWorkouts)
      );
    }

    return response;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du workout:", error);
    throw error;
  }
}


export async function getWorkoutById(id: string, token?: string): Promise<fullPlannedWorkout> {
  console.log("Récupération du workout avec ID:", id);
  try {
    const response = await api.get<APIWorkoutResponse>(`/workouts/planned/${id}`, token);
    console.log("Workout récupéré: \n", JSON.stringify(response, null, 2));

    // Extract workout from wrapper and transform exercises
    const workout = response.workout;
    const totalExercises = response.totalExercises;

    // Transform exercises to match expected format
    const transformedExercises: WorkoutExercise[] = workout.exercises.map((ex) => ({
      exerciseId: ex.exercise.id,
      exerciseName: ex.exercise.name,
      sets: ex.sets || [],
      plannedRestSeconds: ex.plannedRestSeconds || 90,
    }));

    // Return in expected format
    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      totalExercises: totalExercises,
      exercises: transformedExercises,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du workout:", error);
    throw error;
  }
}