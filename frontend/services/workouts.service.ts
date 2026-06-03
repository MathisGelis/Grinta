import { api } from "./api";
import { saveItem, getItem } from "@/core/services/storage";

export interface PlannedWorkout {
  id: string;
  title: string;
  description: string;
  totalExercises: number;
  workout?: {
    id?: string;
    title?: string;
    description?: string;
  };
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

const PLANNED_WORKOUTS_CACHE_KEY = "planned_workouts_cache";

export async function getPlannedWorkouts(
  token?: string
): Promise<PlannedWorkout[]> {
  try {
    const response = await api.get<PlannedWorkout[]>(
      "/workouts/planned",
      token
    );
    const normalized = response.map((item) => ({
      id: item.workout?.id ?? item.id,
      title: item.title ?? item.workout?.title ?? "",
      description: item.description ?? item.workout?.description ?? "",
      totalExercises: item.totalExercises,
      workout: item.workout,
    }));
    await saveItem(PLANNED_WORKOUTS_CACHE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    console.log("Erreur lors de la récupération des workouts planifiés:", error);
    const cachedData = await getItem(PLANNED_WORKOUTS_CACHE_KEY);
    if (cachedData) {
      console.log("Utilisation des données en cache");
      const parsed = JSON.parse(cachedData) as PlannedWorkout[];
      return parsed.map((item) => ({
        id: item.workout?.id ?? item.id,
        title: item.title ?? item.workout?.title ?? "",
        description: item.description ?? item.workout?.description ?? "",
        totalExercises: item.totalExercises,
        workout: item.workout,
      }));
    }

    return [];
  }
}

export async function clearPlannedWorkoutsCache(): Promise<void> {
  try {
    const { removeItem } = await import("@/core/services/storage");
    await removeItem(PLANNED_WORKOUTS_CACHE_KEY);
  } catch (error) {
    console.error("Erreur lors du nettoyage du cache:", error);
  }
}

export async function deletePlannedWorkout(
  id: string,
  token?: string
): Promise<void> {
  try {
    await api.delete(`/workouts/planned/${id}`, token);

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

export async function createPlannedWorkout(
  workoutData: CreateWorkoutRequest,
  token?: string
): Promise<PlannedWorkout> {
  try {
    const response = await api.post<PlannedWorkout>(
      "/workouts/planned",
      workoutData,
      token
    );

    const cachedData = await getItem(PLANNED_WORKOUTS_CACHE_KEY);
    if (cachedData) {
      const workouts = JSON.parse(cachedData) as PlannedWorkout[];
      workouts.push(response);
      await saveItem(
        PLANNED_WORKOUTS_CACHE_KEY,
        JSON.stringify(workouts)
      );
    } else {
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

export async function updatePlannedWorkout(
  id: string,
  workoutData: UpdateWorkoutRequest,
  token?: string
): Promise<PlannedWorkout> {
  try {
    const response = await api.patch<PlannedWorkout>(
      `/workouts/planned/${id}`,
      workoutData,
      token
    );

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
  try {
    const response = await api.get<APIWorkoutResponse>(`/workouts/planned/${id}`, token);
    const workout = response.workout;
    const totalExercises = response.totalExercises;

    const transformedExercises: WorkoutExercise[] = workout.exercises.map((ex) => ({
      exerciseId: ex.exercise.id,
      exerciseName: ex.exercise.name,
      sets: ex.sets || [],
      plannedRestSeconds: ex.plannedRestSeconds || 90,
    }));

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