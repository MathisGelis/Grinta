import React from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
export interface ExerciseSetupData {
  id: string;
  name: string;
  sets: {
    reps: number;
    weight: number;
  }[];
}

interface ExerciseSetupItemProps {
  exercise: ExerciseSetupData;
  onUpdate: (updated: ExerciseSetupData) => void;
  onRemove: () => void;
}

export default function ExerciseSetupItem({
  exercise,
  onUpdate,
  onRemove,
}: ExerciseSetupItemProps) {
  const { t } = useTranslation();
  const handleAddSet = () => {
    const newSet = {
      reps: exercise.sets[exercise.sets.length - 1]?.reps || 10,
      weight: exercise.sets[exercise.sets.length - 1]?.weight || 0,
    };
    onUpdate({
      ...exercise,
      sets: [...exercise.sets, newSet],
    });
  };

  const handleRemoveSet = (index: number) => {
    if (exercise.sets.length > 1) {
      onUpdate({
        ...exercise,
        sets: exercise.sets.filter((_, i) => i !== index),
      });
    }
  };

  const handleSetRepsChange = (index: number, value: string) => {
    const num = parseInt(value) || 1;
    const newSets = [...exercise.sets];
    newSets[index].reps = Math.max(1, num);
    onUpdate({ ...exercise, sets: newSets });
  };

  const handleSetWeightChange = (index: number, value: string) => {
    const num = parseFloat(value) || 0;
    const newSets = [...exercise.sets];
    newSets[index].weight = Math.max(0, num);
    onUpdate({ ...exercise, sets: newSets });
  };

  return (
    <View className="gap-4 rounded-card bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
            <Ionicons
              name="barbell"
              size={18}
              color={WorkoutTheme.accent.purple}
            />
          </View>
          <Text
            className="flex-1 text-base font-semibold text-ink"
            numberOfLines={1}
          >
            {exercise.name}
          </Text>
          <View className="h-7 min-w-[28px] items-center justify-center rounded-full bg-raised px-2">
            <Text className="text-xs font-semibold text-ink">
              {exercise.sets.length}
            </Text>
          </View>
        </View>
        <PressableScale
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t.removeExercise}
          className="h-10 w-10 items-center justify-center rounded-full bg-danger-tint"
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={WorkoutTheme.status.danger}
          />
        </PressableScale>
      </View>

      <View className="gap-2">
        {exercise.sets.map((set, index) => (
          <View
            key={index}
            className="flex-row items-end gap-3 rounded-tile bg-background p-3"
          >
            <Text className="w-14 pb-3 text-xs font-medium text-ink-muted">
              {t.setLabel} {index + 1}
            </Text>

            <View className="flex-1">
              <Text className="mb-1 text-center text-[11px] text-ink-muted">
                {t.repsLabel}
              </Text>
              <TextInput
                className="h-10 rounded-full bg-surface px-2 py-0 text-center text-[15px] font-semibold text-ink"
                value={set.reps.toString()}
                onChangeText={(value) => handleSetRepsChange(index, value)}
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor={WorkoutTheme.text.tertiary}
              />
            </View>

            <View className="flex-1">
              <Text className="mb-1 text-center text-[11px] text-ink-muted">
                {t.weightKgLabel}
              </Text>
              <TextInput
                className="h-10 rounded-full bg-surface px-2 py-0 text-center text-[15px] font-semibold text-ink"
                value={set.weight.toString()}
                onChangeText={(value) => handleSetWeightChange(index, value)}
                keyboardType="decimal-pad"
                maxLength={5}
                placeholderTextColor={WorkoutTheme.text.tertiary}
              />
            </View>

            {exercise.sets.length > 1 && (
              <PressableScale
                onPress={() => handleRemoveSet(index)}
                accessibilityRole="button"
                accessibilityLabel={format(t.removeSetN, { n: index + 1 })}
                className="h-10 w-10 items-center justify-center rounded-full bg-raised"
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={WorkoutTheme.text.secondary}
                />
              </PressableScale>
            )}
          </View>
        ))}
      </View>

      <PressableScale
        onPress={handleAddSet}
        accessibilityRole="button"
        className="h-11 flex-row items-center justify-center gap-2 rounded-full bg-accent-tint"
      >
        <Ionicons name="add" size={18} color={WorkoutTheme.accent.purple} />
        <Text className="text-sm font-semibold text-accent">
          {t.addSet}
        </Text>
      </PressableScale>
    </View>
  );
}
