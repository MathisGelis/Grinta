import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActiveSession,
  getActiveSession,
} from "@/services/active-session.service";

/**
 * Reads the minimized session on every focus, so callers learn about it as
 * soon as the tabs come back. Deliberately does not tick the timer: the
 * consumers that need a running clock derive it from the session themselves,
 * which keeps the once-a-second re-render out of the tab layout.
 */
export function useActiveSession(): ActiveSession | null {
  const [session, setSession] = useState<ActiveSession | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      getActiveSession().then((stored) => {
        if (!cancelled) setSession(stored);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return session;
}

export function resumeSession(session: ActiveSession) {
  router.push({
    pathname: "/(workout)/active-workout",
    params: {
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      resume: "1",
    },
  });
}
