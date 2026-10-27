import type { Slug } from "react-native-body-highlighter";

export type BodySide = "front" | "back";

export const MUSCLE_TO_SLUG: Record<string, Slug> = {
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  front_delts: "deltoids",
  side_delts: "deltoids",
  rear_delts: "deltoids",
  upper_chest: "chest",
  middle_chest: "chest",
  lower_chest: "chest",
  lats: "upper-back",
  rhomboids: "upper-back",
  traps: "trapezius",
  lower_back: "lower-back",
  upper_abs: "abs",
  lower_abs: "abs",
  obliques: "obliques",
  glutes: "gluteal",
  adductors: "adductors",
  quads: "quadriceps",
  hamstrings: "hamstring",
  calves: "calves",
  neck: "neck",
};

const BACK_ONLY: Slug[] = ["upper-back", "lower-back", "gluteal", "hamstring"];
const FRONT_ONLY: Slug[] = [
  "chest",
  "abs",
  "obliques",
  "biceps",
  "quadriceps",
  "tibialis",
];

export type MuscleValue = {
  muscle: string;
  value: number;
  color?: string;
  label?: string;
};

export type SlugGroup = {
  slug: Slug;
  value: number;
  muscles: string[];
  items: MuscleValue[];
  color?: string;
};

export type GroupedMuscles = {
  groups: SlugGroup[];
  unmapped: MuscleValue[];
};

export function groupMusclesBySlug(items: MuscleValue[]): GroupedMuscles {
  const bySlug = new Map<Slug, SlugGroup>();
  const unmapped: MuscleValue[] = [];

  for (const item of items) {
    if (item.value <= 0) continue;
    const slug = MUSCLE_TO_SLUG[item.muscle];
    if (!slug) {
      unmapped.push(item);
      continue;
    }
    const group = bySlug.get(slug);
    if (group) {
      if (item.color && item.value > Math.max(...group.items.map((i) => i.value))) {
        group.color = item.color;
      }
      group.value += item.value;
      group.muscles.push(item.muscle);
      group.items.push(item);
    } else {
      bySlug.set(slug, {
        slug,
        value: item.value,
        muscles: [item.muscle],
        items: [item],
        color: item.color,
      });
    }
  }

  return { groups: [...bySlug.values()], unmapped };
}

export function intensityLevel(value: number, max: number, levels: number): number {
  if (max <= 0) return 1;
  return Math.min(levels, Math.max(1, Math.ceil((value / max) * levels)));
}

export function preferredSide(groups: SlugGroup[]): BodySide {
  let front = 0;
  let back = 0;
  for (const group of groups) {
    if (BACK_ONLY.includes(group.slug)) back += group.value;
    else if (FRONT_ONLY.includes(group.slug)) front += group.value;
  }
  return back > front ? "back" : "front";
}

export type ExerciseSetCount = {
  exerciseId: string;
  setCount: number;
};

type MuscleSource = {
  primary_muscle: string;
  secondary_muscles?: string[] | null;
};

export function effectiveSetsByMuscle(
  entries: ExerciseSetCount[],
  exercisesById: Map<string, MuscleSource>,
): MuscleValue[] {
  const sets = new Map<string, number>();
  const add = (muscle: string, value: number) =>
    sets.set(muscle, (sets.get(muscle) ?? 0) + value);

  for (const { exerciseId, setCount } of entries) {
    const exercise = exercisesById.get(exerciseId);
    if (!exercise || setCount <= 0) continue;
    add(exercise.primary_muscle, setCount);
    for (const secondary of exercise.secondary_muscles ?? []) {
      add(secondary, setCount * 0.5);
    }
  }

  return [...sets.entries()].map(([muscle, value]) => ({ muscle, value }));
}
