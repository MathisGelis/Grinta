import { api, isNotFound } from "./api";
import { TokenService } from "./token.service";
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

/** `GET /exercises/:id` : en plus de la liste, description, consignes et photos. */
export interface ExerciseDetail extends Exercise {
  description?: string | null;
  instructions?: string[] | null;
  image_urls?: string[] | null;
}

// v2 : le catalogue a été renommé (équipement dans le nom) et étendu côté serveur.
const EXERCISES_STORAGE_KEY = "exercises_cache_v2";
const EXERCISES_CACHED_AT_KEY = "exercises_cache_v2_at";
const LEGACY_CACHE_KEYS = ["exercises_cache", "exercises_cache_at"];
const USER_CREATED_EXERCISES_KEY = "user_created_exercises";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let memoryCache: Exercise[] | null = null;
let memoryCachedAt = 0;
let refreshing: Promise<Exercise[]> | null = null;
let createdIdsCache: string[] | null = null;

export const peekExercises = (): Exercise[] | null => memoryCache;

const fetchAndStoreExercises = (): Promise<Exercise[]> => {
  if (!refreshing) {
    refreshing = api
      .get<Exercise[]>("/exercises")
      .then(async (exercises) => {
        memoryCache = exercises;
        memoryCachedAt = Date.now();
        await saveItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises));
        await saveItem(EXERCISES_CACHED_AT_KEY, String(memoryCachedAt));
        return exercises;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

export const getAllExercises = async (): Promise<Exercise[]> => {
  const isFresh = () => Date.now() - memoryCachedAt < CACHE_TTL_MS;
  try {
    void Promise.all(LEGACY_CACHE_KEYS.map(removeItem));
    if (!memoryCache) {
      const [cached, cachedAt] = await Promise.all([
        getItem(EXERCISES_STORAGE_KEY),
        getItem(EXERCISES_CACHED_AT_KEY),
      ]);
      if (cached) {
        memoryCache = JSON.parse(cached);
        memoryCachedAt = Number(cachedAt) || 0;
      }
    }

    if (memoryCache) {
      if (!isFresh()) fetchAndStoreExercises().catch(() => {});
      return memoryCache;
    }

    return await fetchAndStoreExercises();
  } catch (error) {
    console.error("Erreur récupération exercices:", error);
    return memoryCache ?? [];
  }
};

let byIdCache: Map<string, Exercise> | null = null;
let byIdSource: Exercise[] | null = null;

export const getExercisesById = async (): Promise<Map<string, Exercise>> => {
  const list = await getAllExercises();
  if (!byIdCache || byIdSource !== list) {
    byIdCache = new Map(list.map((exercise) => [exercise.id, exercise]));
    byIdSource = list;
  }
  return byIdCache;
};

const clearExercisesCache = async (): Promise<void> => {
  memoryCache = null;
  memoryCachedAt = 0;
  await removeItem(EXERCISES_STORAGE_KEY);
  await removeItem(EXERCISES_CACHED_AT_KEY);
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
  if (createdIdsCache) return createdIdsCache;
  const stored = await getItem(USER_CREATED_EXERCISES_KEY);
  createdIdsCache = stored ? JSON.parse(stored) : [];
  return createdIdsCache as string[];
};

const addUserCreatedExerciseId = async (exerciseId: string): Promise<void> => {
  const current = await getUserCreatedExerciseIds();
  if (!current.includes(exerciseId)) {
    createdIdsCache = [...current, exerciseId];
    await saveItem(USER_CREATED_EXERCISES_KEY, JSON.stringify(createdIdsCache));
  }
};

const removeUserCreatedExerciseId = async (
  exerciseId: string,
): Promise<void> => {
  const current = await getUserCreatedExerciseIds();
  createdIdsCache = current.filter((id) => id !== exerciseId);
  await saveItem(USER_CREATED_EXERCISES_KEY, JSON.stringify(createdIdsCache));
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

export const getExerciseById = async (exerciseId: string): Promise<ExerciseDetail> => {
  const token = await TokenService.get();
  return api.get<ExerciseDetail>(`/exercises/${exerciseId}`, token ?? undefined);
};

export const updateExercise = async (
  exerciseId: string,
  data: Partial<CreateExerciseDTO>,
  token?: string,
): Promise<Exercise> => {
  try {
    const exercise = await api.patch<Exercise>(`/exercises/${exerciseId}`, data, token);
    await clearExercisesCache();
    return exercise;
  } catch (error) {
    console.error("Erreur modification exercice:", error);
    throw error;
  }
};

/**
 * Stats calculées par le serveur à partir des séances terminées.
 * `GET /exercises/:id/stats` répond 404 tant que l'exercice n'a jamais été pratiqué.
 */
export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  lastPerformedAt: string | null;
  lastWeight: number | null;
  lastReps: number | null;
  lastSets: { reps: number; weight: number }[];
  prWeight: number | null;
  prReps: number | null;
  bestEstimatedOneRepMax: number | null;
  bestSessionVolume: number | null;
  maxReps: number | null;
  totalSessions: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  updatedAt: string;
}

/** Ce qu'affiche la séance en cours : dernière performance et record de charge. */
export type LiveExerciseStats = Partial<
  Pick<ExerciseStats, "lastWeight" | "lastReps" | "prWeight">
>;

export const getExerciseStats = async (
  exerciseId: string,
): Promise<ExerciseStats | null> => {
  const token = await TokenService.get();
  try {
    return await api.get<ExerciseStats>(
      `/exercises/${exerciseId}/stats`,
      token ?? undefined,
    );
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
};

/** Tous les exercices pratiqués, du plus récent au plus ancien. */
export const getAllExerciseStats = async (): Promise<ExerciseStats[]> => {
  const token = await TokenService.get();
  return api.get<ExerciseStats[]>("/exercises/stats", token ?? undefined);
};
