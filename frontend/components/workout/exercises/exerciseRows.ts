import type { Exercise } from "@/services/exercises.service";
import type { Strings } from "@/i18n/translations";
import { normalizeText } from "@/utils/text";
import { MUSCLE_GROUP_ORDER, MuscleGroup, muscleGroupOf } from "./muscleGroups";
import type { ExerciseFilters } from "./ExerciseFilterSheet";

export type ExerciseListRow =
  | { kind: "header"; key: string; title: string; count: number }
  | { kind: "exercise"; key: string; exercise: Exercise; canDelete: boolean };

/** Exercices créés par l'utilisateur d'abord, puis un bloc par groupe musculaire. */
export function buildExerciseRows(
  indexed: { exercise: Exercise; lowerName: string }[],
  createdSet: Set<string>,
  filters: ExerciseFilters,
  needle: string,
  t: Strings,
): ExerciseListRow[] {
  const mine: ExerciseListRow[] = [];
  const byGroup = new Map<MuscleGroup, ExerciseListRow[]>();

  for (const { exercise, lowerName } of indexed) {
    if (filters.equipment && exercise.equipment_type !== filters.equipment) continue;
    if (filters.muscle && exercise.primary_muscle !== filters.muscle) continue;
    if (filters.type && exercise.exercise_type !== filters.type) continue;
    if (needle && !lowerName.includes(needle)) continue;

    const canDelete = createdSet.has(exercise.id);
    const row: ExerciseListRow = { kind: "exercise", key: exercise.id, exercise, canDelete };
    if (canDelete) {
      mine.push(row);
      continue;
    }
    const group = muscleGroupOf(exercise.primary_muscle);
    const list = byGroup.get(group);
    if (list) list.push(row);
    else byGroup.set(group, [row]);
  }

  const rows: ExerciseListRow[] = [];
  if (mine.length > 0) {
    rows.push({ kind: "header", key: "mine", title: t.yourExercises, count: mine.length }, ...mine);
  }
  for (const group of MUSCLE_GROUP_ORDER) {
    const items = byGroup.get(group);
    if (!items) continue;
    rows.push(
      { kind: "header", key: `group-${group}`, title: t.muscleGroupNames[group], count: items.length },
      ...items,
    );
  }
  return rows;
}

export const indexExercises = (exercises: Exercise[]) =>
  exercises.map((exercise) => ({ exercise, lowerName: normalizeText(exercise.name) }));
