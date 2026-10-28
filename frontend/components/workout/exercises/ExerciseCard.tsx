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

function ExerciseCard({ exercise, canDelete, onOpen, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(exercise.id)}
      className="mb-3 rounded-card bg-surface p-5 active:opacity-70"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs text-ink-muted">
            {t.exerciseTypeNames[exercise.exercise_type] ??
              exercise.exercise_type.replace(/_/g, " ")}
          </Text>
          <Text className="mt-1 text-xl font-semibold text-ink">
            {exercise.name}
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <View className="h-8 justify-center rounded-full bg-accent-tint px-3">
              <Text className="text-xs font-medium text-accent-text">
                {t.muscleNames[exercise.primary_muscle] ??
                  exercise.primary_muscle.replace(/_/g, " ")}
              </Text>
            </View>
            <View className="h-8 justify-center rounded-full bg-raised px-3">
              <Text className="text-xs font-medium text-ink-light">
                {t.equipmentNames[exercise.equipment_type] ??
                  exercise.equipment_type.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        </View>
        {canDelete && (
          <Pressable
            onPress={() => onDelete(exercise)}
            accessibilityRole="button"
            accessibilityLabel={t.deleteExercise}
            className="h-10 w-10 items-center justify-center rounded-full bg-danger-tint active:opacity-70"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={WorkoutTheme.status.danger}
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default React.memo(ExerciseCard);
