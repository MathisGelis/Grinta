import {
  ExerciseSession,
  SessionSummary,
  summarizeSession,
} from '../../exercise/utils/exercise-history.util';
import { BadgeType } from '../enums/badge-type.enum';

export interface PersonalRecord {
  type: BadgeType;
  value: number;
  previousValue: number;
  /** The set behind the record, null for a whole-session record. */
  weight: number | null;
  reps: number | null;
}

/**
 * Records set by `workoutId` on one exercise, given every session of that
 * exercise. A record needs a previous value to beat: the first session of an
 * exercise, or the first loaded set after only bodyweight sets, sets the
 * baseline without a badge, otherwise every new exercise would earn one. The
 * comparison is against all the other workouts whatever their date, so
 * logging an old session that beats today's best still counts as a record.
 */
export function detectPersonalRecords(
  sessions: ExerciseSession[],
  workoutId: string,
): PersonalRecord[] {
  const current = sessions.filter((s) => s.workoutId === workoutId);

  if (!current.length) return [];
  const mine = summarizeSession(current.flatMap((s) => s.sets));
  const others = sessions
    .filter((s) => s.workoutId !== workoutId)
    .map((s) => summarizeSession(s.sets));
  const best = (pick: (s: SessionSummary) => number) =>
    Math.max(0, ...others.map(pick));
  const candidates: PersonalRecord[] = [
    {
      type: BadgeType.HEAVIEST_WEIGHT,
      value: mine.heaviestWeight,
      previousValue: best((s) => s.heaviestWeight),
      weight: mine.heaviestWeight,
      reps: mine.repsAtHeaviest,
    },
    {
      type: BadgeType.BEST_ESTIMATED_1RM,
      value: mine.bestEstimatedOneRepMax,
      previousValue: best((s) => s.bestEstimatedOneRepMax),
      weight: mine.bestSet?.weight ?? null,
      reps: mine.bestSet?.reps ?? null,
    },
    {
      type: BadgeType.BEST_SESSION_VOLUME,
      value: mine.volume,
      previousValue: best((s) => s.volume),
      weight: null,
      reps: null,
    },
    {
      type: BadgeType.MOST_REPS,
      value: mine.maxUnloadedReps,
      previousValue: best((s) => s.maxUnloadedReps),
      weight: 0,
      reps: mine.maxUnloadedReps,
    },
  ];

  // Values are already rounded to 2 decimals, so equal stays equal.
  return candidates.filter(
    (c) => c.previousValue > 0 && c.value > c.previousValue,
  );
}
