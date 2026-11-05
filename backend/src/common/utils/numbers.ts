/**
 * How the API rounds the figures it returns, one rule per kind of figure,
 * so that the same number reads the same on every screen. Computations keep
 * full precision (records are detected on exact values); these rules only
 * apply when a figure leaves the API. The app formats, it does not round.
 *
 * - A load the user entered or lifted (a set's weight, the heaviest
 *   weight): as entered, 2 decimals at most (62.5, 1.25).
 * - An estimate or an average (1RM, average weight per set, workouts per
 *   week): 1 decimal.
 * - A volume (reps x weight) and calories: whole numbers.
 * Percentages keep 1 decimal and ratios 2, as before.
 */
const toDecimals = (value: number, decimals: number) => {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
};

export const roundLoad = (kg: number) => toDecimals(kg, 2);

export const roundEstimate = (value: number) => toDecimals(value, 1);

export const roundVolume = (kg: number) => Math.round(kg);

export const roundCalories = (kcal: number) => Math.round(kcal);
