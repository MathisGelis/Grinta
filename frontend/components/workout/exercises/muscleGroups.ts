export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "legs"
  | "other";

export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "core",
  "legs",
  "other",
];

const GROUP_BY_MUSCLE: Record<string, MuscleGroup> = {
  upper_chest: "chest",
  middle_chest: "chest",
  lower_chest: "chest",
  lats: "back",
  rhomboids: "back",
  traps: "back",
  lower_back: "back",
  front_delts: "shoulders",
  side_delts: "shoulders",
  rear_delts: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  upper_abs: "core",
  lower_abs: "core",
  obliques: "core",
  glutes: "legs",
  hip_flexors: "legs",
  abductors: "legs",
  adductors: "legs",
  quads: "legs",
  hamstrings: "legs",
  calves: "legs",
};

export function muscleGroupOf(muscle: string): MuscleGroup {
  return GROUP_BY_MUSCLE[muscle] ?? "other";
}
