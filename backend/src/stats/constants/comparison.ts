import { StatsPeriod } from '../dto/period-query.dto';

/** Number of full periods averaged to build the personal baseline. */
export const BASELINE_PERIODS: Record<StatsPeriod, number> = {
  [StatsPeriod.WEEK]: 8,
  [StatsPeriod.MONTH]: 6,
};

/** A metric within this many percent of the baseline counts as on track. */
export const ON_TRACK_THRESHOLD_PCT = 5;

/** Metrics compared against the personal baseline, same set as /stats/summary. */
export const COMPARED_METRICS = [
  'workouts',
  'durationSeconds',
  'sets',
  'reps',
  'volume',
  'calories',
] as const;

export type ComparedMetric = (typeof COMPARED_METRICS)[number];
