import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/exercises/ExerciseSetupItem";

import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
interface ExerciseSectionProps {
  exercises: ExerciseSetupData[];
  onAdd: () => void;
  onUpdate: (updated: ExerciseSetupData) => void;
  onRemove: (id: string) => void;
}

export default function ExerciseSection({
  exercises,
  onAdd,
  onUpdate,
  onRemove,
}: ExerciseSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-ink">
          {t.exercises}{" "}
          <Text className="text-base font-normal text-ink-muted">
            {exercises.length}
          </Text>
        </Text>
        <PressableScale
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t.addExerciseTitle}
          className="h-11 w-11 items-center justify-center rounded-full bg-accent"
        >
          <Ionicons name="add" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
      </View>

      {exercises.length > 0 ? (
        <View className="gap-3">
          {exercises.map((exercise) => (
            <ExerciseSetupItem
              key={exercise.id}
              exercise={exercise}
              onUpdate={onUpdate}
              onRemove={() => onRemove(exercise.id)}
            />
          ))}
        </View>
      ) : (
        <View className="items-center gap-3 rounded-card bg-surface p-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-raised">
            <Ionicons
              name="barbell"
              size={26}
              color={WorkoutTheme.text.tertiary}
            />
          </View>
          <Text className="text-base font-semibold text-ink-soft">
            {t.noExercisesAdded}
          </Text>
          <Text className="text-center text-sm text-ink-muted">
            {t.tapToAddExercise}
          </Text>
        </View>
      )}
    </View>
  );
}
