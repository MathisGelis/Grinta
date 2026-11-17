/** Durée par défaut d'une série (mise en place + tempo), hors repos. */
const SET_SETUP_SECONDS = 30;
const SECONDS_PER_REP = 5;
/** Changement de machine / préparation entre deux exercices. */
const EXERCISE_TRANSITION_SECONDS = 60;
const DEFAULT_REST_SECONDS = 90;

type EstimableExercise = {
  sets: { reps: number }[];
  plannedRestSeconds?: number | null;
};

/**
 * Estime la durée d'une séance (en secondes) à partir de ses exercices :
 * temps d'effort de chaque série (≈ 5 s par répétition + mise en place), repos planifié
 * entre les séries (pas de repos après la toute dernière) et transition entre exercices.
 */
export function estimateWorkoutSeconds(
  exercises: EstimableExercise[],
  defaultRestSeconds: number = DEFAULT_REST_SECONDS,
): number {
  const filled = exercises.filter((exercise) => exercise.sets.length > 0);
  let seconds = 0;
  filled.forEach((exercise, index) => {
    const rest = Math.max(0, exercise.plannedRestSeconds ?? defaultRestSeconds);
    exercise.sets.forEach((set, setIndex) => {
      seconds += SET_SETUP_SECONDS + Math.max(0, set.reps) * SECONDS_PER_REP;
      const isLastSet = setIndex === exercise.sets.length - 1;
      if (!(isLastSet && index === filled.length - 1)) seconds += rest;
    });
    if (index < filled.length - 1) seconds += EXERCISE_TRANSITION_SECONDS;
  });
  return seconds;
}

/** Durée estimée en minutes (arrondie, au moins 1 min dès qu'il y a une série), plafonnée à 600. */
export function estimateWorkoutMinutes(
  exercises: EstimableExercise[],
  defaultRestSeconds?: number,
): number {
  const seconds = estimateWorkoutSeconds(exercises, defaultRestSeconds);
  if (seconds === 0) return 0;
  return Math.min(600, Math.max(1, Math.round(seconds / 60)));
}
