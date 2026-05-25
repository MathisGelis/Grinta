import { DetailedMuscleGroup } from '../../exercise/enums/detailed-muscle.enum';

export enum MuscleCategory {
  PUSH = 'push',
  PULL = 'pull',
  LEGS = 'legs',
  CORE = 'core',
  OTHER = 'other',
}

export enum BodyRegion {
  UPPER = 'upper',
  LOWER = 'lower',
  CORE = 'core',
  OTHER = 'other',
}

export const MUSCLE_CATEGORY: Record<DetailedMuscleGroup, MuscleCategory> = {
  [DetailedMuscleGroup.UPPER_CHEST]: MuscleCategory.PUSH,
  [DetailedMuscleGroup.MIDDLE_CHEST]: MuscleCategory.PUSH,
  [DetailedMuscleGroup.LOWER_CHEST]: MuscleCategory.PUSH,
  [DetailedMuscleGroup.FRONT_DELTS]: MuscleCategory.PUSH,
  [DetailedMuscleGroup.SIDE_DELTS]: MuscleCategory.PUSH,
  [DetailedMuscleGroup.TRICEPS]: MuscleCategory.PUSH,

  [DetailedMuscleGroup.LATS]: MuscleCategory.PULL,
  [DetailedMuscleGroup.RHOMBOIDS]: MuscleCategory.PULL,
  [DetailedMuscleGroup.TRAPS]: MuscleCategory.PULL,
  [DetailedMuscleGroup.REAR_DELTS]: MuscleCategory.PULL,
  [DetailedMuscleGroup.BICEPS]: MuscleCategory.PULL,
  [DetailedMuscleGroup.FOREARMS]: MuscleCategory.PULL,
  [DetailedMuscleGroup.LOWER_BACK]: MuscleCategory.PULL,

  [DetailedMuscleGroup.QUADS]: MuscleCategory.LEGS,
  [DetailedMuscleGroup.HAMSTRINGS]: MuscleCategory.LEGS,
  [DetailedMuscleGroup.GLUTES]: MuscleCategory.LEGS,
  [DetailedMuscleGroup.CALVES]: MuscleCategory.LEGS,
  [DetailedMuscleGroup.HIP_FLEXORS]: MuscleCategory.LEGS,
  [DetailedMuscleGroup.ABDUCTORS]: MuscleCategory.LEGS,
  [DetailedMuscleGroup.ADDUCTORS]: MuscleCategory.LEGS,

  [DetailedMuscleGroup.UPPER_ABS]: MuscleCategory.CORE,
  [DetailedMuscleGroup.LOWER_ABS]: MuscleCategory.CORE,
  [DetailedMuscleGroup.OBLIQUES]: MuscleCategory.CORE,

  [DetailedMuscleGroup.NECK]: MuscleCategory.OTHER,
  [DetailedMuscleGroup.FULL_BODY]: MuscleCategory.OTHER,
  [DetailedMuscleGroup.CARDIO]: MuscleCategory.OTHER,
};

export const MUSCLE_REGION: Record<DetailedMuscleGroup, BodyRegion> = {
  [DetailedMuscleGroup.BICEPS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.TRICEPS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.FOREARMS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.FRONT_DELTS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.SIDE_DELTS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.REAR_DELTS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.UPPER_CHEST]: BodyRegion.UPPER,
  [DetailedMuscleGroup.MIDDLE_CHEST]: BodyRegion.UPPER,
  [DetailedMuscleGroup.LOWER_CHEST]: BodyRegion.UPPER,
  [DetailedMuscleGroup.LATS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.RHOMBOIDS]: BodyRegion.UPPER,
  [DetailedMuscleGroup.TRAPS]: BodyRegion.UPPER,

  [DetailedMuscleGroup.LOWER_BACK]: BodyRegion.CORE,
  [DetailedMuscleGroup.UPPER_ABS]: BodyRegion.CORE,
  [DetailedMuscleGroup.LOWER_ABS]: BodyRegion.CORE,
  [DetailedMuscleGroup.OBLIQUES]: BodyRegion.CORE,

  [DetailedMuscleGroup.GLUTES]: BodyRegion.LOWER,
  [DetailedMuscleGroup.HIP_FLEXORS]: BodyRegion.LOWER,
  [DetailedMuscleGroup.ABDUCTORS]: BodyRegion.LOWER,
  [DetailedMuscleGroup.ADDUCTORS]: BodyRegion.LOWER,
  [DetailedMuscleGroup.QUADS]: BodyRegion.LOWER,
  [DetailedMuscleGroup.HAMSTRINGS]: BodyRegion.LOWER,
  [DetailedMuscleGroup.CALVES]: BodyRegion.LOWER,

  [DetailedMuscleGroup.NECK]: BodyRegion.OTHER,
  [DetailedMuscleGroup.FULL_BODY]: BodyRegion.OTHER,
  [DetailedMuscleGroup.CARDIO]: BodyRegion.OTHER,
};
