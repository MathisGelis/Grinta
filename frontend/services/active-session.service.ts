import { getItem, removeItem, saveItem } from "@/core/services/storage";
import type { CompletedSet } from "@/components/workout/session/CurrentExerciseSection";
import type { WorkoutExercise } from "./workouts.service";

const ACTIVE_SESSION_KEY = "active_workout_session";

export interface ExerciseState {
  exerciseData: WorkoutExercise;
  completedSetIndices: number[];
  completedSets: CompletedSet[];
  restTimeSeconds: number;
}

export interface ActiveSession {
  workoutId: string;
  workoutName: string;
  exercisesState: ExerciseState[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  completedExercises: number[];
  totalWorkoutTime: number;
  /** Epoch ms of the last save, used to keep the timer running while minimized. */
  savedAt: number;
}

export async function saveActiveSession(
  session: Omit<ActiveSession, "savedAt">,
): Promise<void> {
  await saveItem(
    ACTIVE_SESSION_KEY,
    JSON.stringify({ ...session, savedAt: Date.now() }),
  );
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  const raw = await getItem(ACTIVE_SESSION_KEY);

  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as ActiveSession;

    // Drop anything we can't resume from rather than crashing the screen.
    if (
      !session?.workoutId ||
      !Array.isArray(session.exercisesState) ||
      session.exercisesState.length === 0
    ) {
      await removeItem(ACTIVE_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    await removeItem(ACTIVE_SESSION_KEY);
    return null;
  }
}

export async function clearActiveSession(): Promise<void> {
  await removeItem(ACTIVE_SESSION_KEY);
}

/** Session duration including the time spent minimized. */
export function elapsedSince(session: ActiveSession): number {
  const away = Math.max(0, Math.floor((Date.now() - session.savedAt) / 1000));

  return session.totalWorkoutTime + away;
}

export function formatSessionTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}
