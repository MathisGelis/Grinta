import { LIMITS } from "./validation";

/** Bornes acceptées par l'API (B-02) : mêmes valeurs côté app pour ne jamais recevoir de 400 évitable. */
const MAX_EXERCISES = 40;
const MAX_SECONDS = 3600;
const MAX_DURATION_SECONDS = 86_400;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

type SetLike = { reps: number; weight: number };

/** 1 à 30 séries, répétitions 1–1000, charge 0–1000 à 2 décimales. `undefined` s'il n'y a aucune série. */
export function sanitizeSets(sets: SetLike[] | null | undefined): SetLike[] | undefined {
  if (!sets || sets.length === 0) return undefined;
  return sets.slice(0, LIMITS.maxSets).map((set) => ({
    reps: Math.round(clamp(set.reps, 1, LIMITS.maxReps)),
    weight: Math.round(clamp(set.weight, 0, LIMITS.maxWeightKg) * 100) / 100,
  }));
}

export const sanitizeTitle = (title: string) => title.trim().slice(0, LIMITS.title);
export const sanitizeDescription = (description: string) => description.slice(0, LIMITS.description);
export const sanitizeSeconds = (seconds: number) => Math.round(clamp(seconds, 0, MAX_SECONDS));
export const sanitizeTotalDuration = (seconds: number) => Math.round(clamp(seconds, 1, MAX_DURATION_SECONDS));
export const limitExercises = <T,>(exercises: T[]): T[] => exercises.slice(0, MAX_EXERCISES);
export { MAX_EXERCISES };
