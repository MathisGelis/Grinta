import { useEffect, useMemo, useState } from "react";
import { Exercise, getExercisesById, refreshExercises } from "@/services/exercises.service";
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

  const ids = (exercises ?? []).map((exercise) => exercise.exerciseId).join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let map = await getExercisesById();
      // Un exercice absent du cache (catalogue périmé) : on recharge le catalogue une fois.
      if (ids && ids.split(",").some((id) => !map.has(id))) {
        await refreshExercises();
        map = await getExercisesById();
      }
      if (!cancelled) setExercisesById(map);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return useMemo(() => {
    const entries: ExerciseSetCount[] = (exercises ?? []).map((exercise) => ({
      exerciseId: exercise.exerciseId,
      // Une séance planifiée sans séries (ex. dupliquée depuis un post) compte 1 série par exercice.
      setCount: exercise.sets.length || 1,
    }));
    return effectiveSetsByMuscle(entries, exercisesById);
  }, [exercises, exercisesById]);
}
