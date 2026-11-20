/** Personal records a completed workout can set on one exercise. */
export enum BadgeType {
  /** Heaviest weight lifted in a single set (kg). */
  HEAVIEST_WEIGHT = 'heaviest_weight',
  /** Best estimated one-rep max of a set, Epley formula (kg). */
  BEST_ESTIMATED_1RM = 'best_estimated_1rm',
  /** Highest reps x weight total in one workout (kg). */
  BEST_SESSION_VOLUME = 'best_session_volume',
  /** Most reps in a single set without added weight. */
  MOST_REPS = 'most_reps',
}

export const BADGE_UNIT: Record<BadgeType, 'kg' | 'reps'> = {
  [BadgeType.HEAVIEST_WEIGHT]: 'kg',
  [BadgeType.BEST_ESTIMATED_1RM]: 'kg',
  [BadgeType.BEST_SESSION_VOLUME]: 'kg',
  [BadgeType.MOST_REPS]: 'reps',
};
