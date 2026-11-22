/**
 * Whose workouts a stats route reads. The caller reads all of their own
 * workouts with their own body weight; another user's stats only count the
 * workouts they published, with the default body weight, since the weight is
 * private.
 */
export interface StatsSubject {
  userId: string;
  publishedOnly: boolean;
}
