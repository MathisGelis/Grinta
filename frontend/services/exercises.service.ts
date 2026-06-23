import { api } from "./api";
import { getItem, saveItem, removeItem } from "@/core/services/storage";

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barre",
  dumbbell: "Haltères",
  machine: "Machine",
  plate_loaded: "Disque de poids",
  smith_machine: "Smith machine",
  cable: "Câble",
  kettlebell: "Kettlebell",
  band: "Bande élastique",
  none: "Sans équipement",
};

export const MUSCLE_LABELS: Record<string, string> = {
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Avant-bras",
  front_delts: "Deltoïdes antérieurs",
  side_delts: "Deltoïdes latéraux",
  rear_delts: "Deltoïdes postérieurs",
  upper_chest: "Haut des pectoraux",
  middle_chest: "Pectoraux moyens",
  lower_chest: "Bas des pectoraux",
  lats: "Grand dorsal",
  rhomboids: "Rhomboïdes",
  traps: "Trapèzes",
  lower_back: "Bas du dos",
  upper_abs: "Abdominaux supérieurs",
  lower_abs: "Abdominaux inférieurs",
  obliques: "Obliques",
  glutes: "Fessiers",
  hip_flexors: "Fléchisseurs de hanche",
  abductors: "Abducteurs",
  adductors: "Adducteurs",
  quads: "Quadriceps",
  hamstrings: "Ischio-jambiers",
  calves: "Mollets",
  neck: "Cou",
  full_body: "Corps entier",
  cardio: "Cardio",
};

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  weight_reps: "Poids libres",
  bodyweight_reps: "Poids du corps",
  weighted_bodyweight: "Poids du corps lesté",
  assisted_bodyweight: "Poids du corps assisté",
  duration: "Durée",
  duration_weight: "Durée + poids",
  distance_duration: "Distance / durée",
  weight_distance: "Poids / distance",
};

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
const USER_CREATED_EXERCISES_KEY = "user_created_exercises";

export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    const cached = await getItem(EXERCISES_STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

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

export interface CreateExerciseDTO {
  name: string;
  equipment_type: string;
  primary_muscle: string;
  secondary_muscles?: string[];
  exercise_type: string;
  image_url?: string;
}

export const getUserCreatedExerciseIds = async (): Promise<string[]> => {
  const stored = await getItem(USER_CREATED_EXERCISES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addUserCreatedExerciseId = async (exerciseId: string): Promise<void> => {
  const current = await getUserCreatedExerciseIds();
  if (!current.includes(exerciseId)) {
    await saveItem(
      USER_CREATED_EXERCISES_KEY,
      JSON.stringify([...current, exerciseId]),
    );
  }
};

export const removeUserCreatedExerciseId = async (
  exerciseId: string,
): Promise<void> => {
  const current = await getUserCreatedExerciseIds();
  await saveItem(
    USER_CREATED_EXERCISES_KEY,
    JSON.stringify(current.filter((id) => id !== exerciseId)),
  );
};

export const createExercise = async (
  exerciseData: CreateExerciseDTO,
  token?: string,
): Promise<Exercise> => {
  try {
    const exercise = await api.post<Exercise>("/exercises", exerciseData, token);
    await addUserCreatedExerciseId(exercise.id);
    await clearExercisesCache();
    return exercise;
  } catch (error) {
    console.error("Erreur création exercice:", error);
    throw error;
  }
};

export const deleteExercise = async (
  exerciseId: string,
  token?: string,
): Promise<void> => {
  try {
    await api.delete(`/exercises/${exerciseId}`, token);
    await removeUserCreatedExerciseId(exerciseId);
    await clearExercisesCache();
  } catch (error) {
    console.error("Erreur suppression exercice:", error);
    throw error;
  }
};
