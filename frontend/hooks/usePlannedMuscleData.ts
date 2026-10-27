import { useEffect, useMemo, useState } from "react";
import { Exercise, getExercisesById } from "@/services/exercises.service";
import {
  ExerciseSetCount,
  MuscleValue,
  effectiveSetsByMuscle,
} from "@/utils/muscles";

export function usePlannedMuscleData(
  exercises: { exerciseId: string; sets: unknown[] }[] | undefined,
): MuscleValue[] {
  const [exercisesById, setExercisesById] = useState<Map<string, Exercise>>(
    new Map(),
  );

  useEffect(() => {
    let cancelled = false;
    getExercisesById()
      .then((map) => {
        if (!cancelled) setExercisesById(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const entries: ExerciseSetCount[] = (exercises ?? []).map((exercise) => ({
      exerciseId: exercise.exerciseId,
      setCount: exercise.sets.length,
    }));
    return effectiveSetsByMuscle(entries, exercisesById);
  }, [exercises, exercisesById]);
}
