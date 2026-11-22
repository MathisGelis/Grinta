import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActiveSession,
  getActiveSession,
} from "@/services/active-session.service";

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
