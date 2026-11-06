import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Exercise } from "@/services/exercises.service";

type Props = {
  exercise: Exercise;
  canDelete: boolean;
  onOpen: (exerciseId: string) => void;
  onDelete: (exercise: Exercise) => void;
};

function ExerciseRow({ exercise, canDelete, onOpen, onDelete }: Props) {
  const { t } = useTranslation();
  const muscle =
    t.muscleNames[exercise.primary_muscle] ??
    exercise.primary_muscle.replace(/_/g, " ");
  const equipment =
    t.equipmentNames[exercise.equipment_type] ??
    exercise.equipment_type.replace(/_/g, " ");

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(exercise.id)}
      className="mb-2 flex-row items-center gap-3 rounded-tile bg-surface px-4 py-3.5 active:opacity-70"
    >
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-medium text-ink">
          {exercise.name}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-xs text-ink-muted">
          {muscle}, {equipment.toLowerCase()}
        </Text>
      </View>
      {canDelete && (
        <Pressable
          onPress={() => onDelete(exercise)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t.deleteExercise}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-danger-tint"
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={WorkoutTheme.status.danger}
          />
        </Pressable>
      )}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={WorkoutTheme.text.tertiary}
      />
    </Pressable>
  );
}

export default React.memo(ExerciseRow);
