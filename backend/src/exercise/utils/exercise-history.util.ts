import { epley1RM, round } from '../../stats/utils/stats.util';
import { SetPair } from '../../workouts/entities/completed-workout.entity';

/**
 * One exercise inside one completed workout. When the same exercise appears
 * twice in a workout its sets are merged into a single session.
 */
export interface ExerciseSession {
  workoutId: string;
  completedAt: Date;
  createdAt: Date;
  sets: SetPair[];
}

export interface SessionSummary {
  sets: number;
  reps: number;
  /** Sum of reps x weight over the loaded sets (kg). */
  volume: number;
  /** 0 when the session has no loaded set. */
  heaviestWeight: number;
  /** Most reps done at heaviestWeight. */
  repsAtHeaviest: number;
  bestEstimatedOneRepMax: number;
  /** Loaded set with the highest estimated 1RM, null without a loaded set. */
  bestSet: SetPair | null;
  /** Most reps in a single set without added weight, 0 if there is none. */
  maxUnloadedReps: number;
  /** Heaviest set, the one with the most reps on a tie, null when empty. */
  topSet: SetPair | null;
}

/** Stored per user and exercise, see UserExerciseStats. */
export interface ExerciseStatsSnapshot {
  totalSessions: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  prWeight: number | null;
  prReps: number | null;
  bestEstimatedOneRepMax: number | null;
  bestSessionVolume: number | null;
  maxReps: number | null;
  lastPerformedAt: Date;
  lastWorkoutId: string;
  lastSets: SetPair[];
  lastWeight: number;
  lastReps: number;
}

/**
 * A set counts when it has at least one rep. Weight 0 is a bodyweight set,
 * a negative or non-numeric value is corrupt data and is dropped.
 */
export function validSets(sets: SetPair[] | null | undefined): SetPair[] {
  return (sets ?? []).filter(
    (s) =>
      !!s &&
      Number.isFinite(s.reps) &&
      Number.isFinite(s.weight) &&
      s.reps > 0 &&
      s.weight >= 0,
  );
}

export function summarizeSession(
  sets: SetPair[] | null | undefined,
): SessionSummary {
  const valid = validSets(sets);
  const loaded = valid.filter((s) => s.weight > 0);
  const unloaded = valid.filter((s) => s.weight === 0);
  const topSet = valid.length
    ? valid.reduce((a, b) =>
        b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps)
          ? b
          : a,
      )
    : null;
  const bestSet = loaded.length
    ? loaded.reduce((a, b) =>
        epley1RM(b.weight, b.reps) > epley1RM(a.weight, a.reps) ? b : a,
      )
    : null;

  return {
    sets: valid.length,
    reps: valid.reduce((acc, s) => acc + s.reps, 0),
    volume: round(loaded.reduce((acc, s) => acc + s.reps * s.weight, 0)),
    heaviestWeight: topSet && topSet.weight > 0 ? topSet.weight : 0,
    repsAtHeaviest: topSet && topSet.weight > 0 ? topSet.reps : 0,
    bestEstimatedOneRepMax: bestSet
      ? round(epley1RM(bestSet.weight, bestSet.reps))
      : 0,
    bestSet,
    maxUnloadedReps: Math.max(0, ...unloaded.map((s) => s.reps)),
    topSet,
  };
}

/** Most recent first: completion date, then creation date, then id. */
export function compareSessionsDesc(
  a: ExerciseSession,
  b: ExerciseSession,
): number {
  return (
    +b.completedAt - +a.completedAt ||
    +b.createdAt - +a.createdAt ||
    b.workoutId.localeCompare(a.workoutId)
  );
}

/**
 * Aggregates the whole history of one exercise for one user. Sessions without
 * a single valid set are ignored, and null is returned when none is left so
 * the caller can drop the stored row.
 */
export function buildExerciseStats(
  sessions: ExerciseSession[],
): ExerciseStatsSnapshot | null {
  const done = sessions
    .map((session) => ({ session, summary: summarizeSession(session.sets) }))
    .filter(({ summary }) => summary.sets > 0)
    .sort((a, b) => compareSessionsDesc(a.session, b.session));

  if (!done.length) return null;
  const summaries = done.map((d) => d.summary);
  const prWeight = Math.max(...summaries.map((s) => s.heaviestWeight));
  const best1rm = Math.max(...summaries.map((s) => s.bestEstimatedOneRepMax));
  const bestVolume = Math.max(...summaries.map((s) => s.volume));
  const maxReps = Math.max(...summaries.map((s) => s.maxUnloadedReps));
  const last = done[0];

  return {
    totalSessions: done.length,
    totalSets: summaries.reduce((acc, s) => acc + s.sets, 0),
    totalReps: summaries.reduce((acc, s) => acc + s.reps, 0),
    totalVolume: round(summaries.reduce((acc, s) => acc + s.volume, 0)),
    prWeight: prWeight > 0 ? prWeight : null,
    prReps:
      prWeight > 0
        ? Math.max(
            ...summaries
              .filter((s) => s.heaviestWeight === prWeight)
              .map((s) => s.repsAtHeaviest),
          )
        : null,
    bestEstimatedOneRepMax: best1rm > 0 ? best1rm : null,
    bestSessionVolume: bestVolume > 0 ? bestVolume : null,
    maxReps: maxReps > 0 ? maxReps : null,
    lastPerformedAt: last.session.completedAt,
    lastWorkoutId: last.session.workoutId,
    lastSets: validSets(last.session.sets),
    lastWeight: last.summary.topSet?.weight ?? 0,
    lastReps: last.summary.topSet?.reps ?? 0,
  };
}

/** What is stored per user and exercise: a snapshot without the last workout id. */
export type StoredExerciseStats = Omit<ExerciseStatsSnapshot, 'lastWorkoutId'>;

const positiveOrNull = (value: number) => (value > 0 ? value : null);

/**
 * The stats once a new session is added to the stored ones, without reading
 * the history again. Gives the same result as buildExerciseStats over the
 * whole history for a session created after every other one, which is the
 * case of a workout being saved: on equal completion dates the newest
 * creation wins, as in compareSessionsDesc. A session without a valid set
 * changes nothing, as buildExerciseStats ignores it.
 */
export function addSession(
  stored: StoredExerciseStats,
  sets: SetPair[] | null | undefined,
  completedAt: Date,
): StoredExerciseStats {
  const session = summarizeSession(sets);

  if (!session.sets) return stored;
  const storedPr = stored.prWeight ?? 0;
  const prWeight = Math.max(storedPr, session.heaviestWeight);
  const prReps = Math.max(
    storedPr === prWeight ? (stored.prReps ?? 0) : 0,
    session.heaviestWeight === prWeight ? session.repsAtHeaviest : 0,
  );
  const isLast = +completedAt >= +stored.lastPerformedAt;

  return {
    totalSessions: stored.totalSessions + 1,
    totalSets: stored.totalSets + session.sets,
    totalReps: stored.totalReps + session.reps,
    totalVolume: round(stored.totalVolume + session.volume),
    prWeight: positiveOrNull(prWeight),
    prReps: prWeight > 0 ? prReps : null,
    bestEstimatedOneRepMax: positiveOrNull(
      Math.max(
        stored.bestEstimatedOneRepMax ?? 0,
        session.bestEstimatedOneRepMax,
      ),
    ),
    bestSessionVolume: positiveOrNull(
      Math.max(stored.bestSessionVolume ?? 0, session.volume),
    ),
    maxReps: positiveOrNull(
      Math.max(stored.maxReps ?? 0, session.maxUnloadedReps),
    ),
    ...(isLast
      ? {
          lastPerformedAt: completedAt,
          lastSets: validSets(sets),
          lastWeight: session.topSet?.weight ?? 0,
          lastReps: session.topSet?.reps ?? 0,
        }
      : {
          lastPerformedAt: stored.lastPerformedAt,
          lastSets: stored.lastSets,
          lastWeight: stored.lastWeight,
          lastReps: stored.lastReps,
        }),
  };
}
