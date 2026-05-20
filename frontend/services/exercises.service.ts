import { api } from "./api";
import { getItem, saveItem, removeItem } from "@/core/services/storage";

export interface Exercise {
  id: string;
  name: string;
  equipment_type: string;
  primary_muscle: string;
  secondary_muscles: string[] | null;
  exercise_type: string;
  image_url: string;
  createdAt: string;
}

const EXERCISES_STORAGE_KEY = "exercises_cache";

export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    const cached = await getItem(EXERCISES_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    console.log("Récupération des exercices depuis l'API...");
    const exercises = await api.get<Exercise[]>("/exercises");
    await saveItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises));
    return exercises;
  } catch (error) {
    console.error("Erreur récupération exercices:", error);
    const cached = await getItem(EXERCISES_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
};

export const refreshExercises = async (): Promise<Exercise[]> => {
  const exercises = await api.get<Exercise[]>("/exercises");
  await saveItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises));
  return exercises;
};

export const clearExercisesCache = async (): Promise<void> => {
  await removeItem(EXERCISES_STORAGE_KEY);
};
