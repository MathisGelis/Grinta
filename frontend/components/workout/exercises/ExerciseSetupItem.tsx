import { useUnits } from "@/contexts/UnitsContext";
import React from "react";
import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WorkoutTheme } from "@/constants/Colors";

import PressableScale from "@/components/ui/PressableScale";
import NumericInput from "@/components/ui/NumericInput";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
export interface ExerciseSetupData {
  id: string;
  name: string;
  sets: {
    reps: number;
    weight: number;
  }[];
  /** Repos entre séries (s) : conservé tel que défini par l'utilisateur lors d'une modification. */
  plannedRestSeconds?: number;
}

interface ExerciseSetupItemProps {
  exercise: ExerciseSetupData;
  onUpdate: (updated: ExerciseSetupData) => void;
  onRemove: () => void;
  tone?: "surface" | "raised";
  /** Si défini, affiche le réglage du repos de l'exercice (valeur par défaut en secondes). */
  defaultRestSeconds?: number;
}

function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: "add" | "remove";
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Ionicons name={icon} size={18} color={WorkoutTheme.accent.purple} />
    </PressableScale>
  );
}

export default function ExerciseSetupItem({
  exercise,
  onUpdate,
  onRemove,
  tone = "surface",
  defaultRestSeconds,
}: ExerciseSetupItemProps) {
  const { t } = useTranslation();
  const { fromKg, toKg, weightUnit } = useUnits();
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

  const handleSetRepsChange = (index: number, value: number) => {
    const newSets = exercise.sets.map((set, i) =>
      i === index ? { ...set, reps: Math.max(1, value) } : set,
    );
    onUpdate({ ...exercise, sets: newSets });
  };

  const handleSetWeightChange = (index: number, value: number) => {
    const newSets = exercise.sets.map((set, i) =>
      i === index ? { ...set, weight: Math.max(0, value) } : set,
    );
    onUpdate({ ...exercise, sets: newSets });
  };

  return (
    <View
      className={`gap-4 rounded-card p-5 ${tone === "raised" ? "bg-raised" : "bg-surface"}`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className="flex-1 text-base font-semibold text-ink"
          numberOfLines={1}
        >
          {exercise.name}
        </Text>
        <View className="flex-row items-center gap-4">
        <PressableScale
          onPress={handleAddSet}
          accessibilityRole="button"
          accessibilityLabel={t.addSet}
          hitSlop={10}
        >
          <Ionicons name="add" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <PressableScale
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={t.removeExercise}
          hitSlop={10}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={WorkoutTheme.status.danger}
          />
        </PressableScale>
        </View>
      </View>

      <View className="gap-2">
        {exercise.sets.map((set, index) => (
          <View
            key={index}
            className={`flex-row items-end gap-3 rounded-tile px-5 py-3 ${tone === "raised" ? "bg-surface" : "bg-raised"}`}
          >
            <Text className="w-5 self-center text-left text-[15px] font-bold text-ink">
              {index + 1}
            </Text>

            <View className="flex-1 items-center">
              <Text className="mb-1 text-center text-[11px] text-ink-muted">
                {t.repsLabel}
              </Text>
              <View
                className={`h-10 flex-row items-center justify-center rounded-full px-3 ${tone === "raised" ? "bg-raised" : "bg-line"}`}
              >
                <StepButton
                  icon="remove"
                  label="-1"
                  onPress={() => handleSetRepsChange(index, set.reps - 1)}
                />
                <NumericInput
                  className="h-10 w-12 px-0 py-0 text-center text-[15px] font-semibold text-ink"
                  value={set.reps}
                  onValueChange={(value) => handleSetRepsChange(index, value)}
                  min={1}
                  maxLength={3}
                />
                <StepButton
                  icon="add"
                  label="+1"
                  onPress={() => handleSetRepsChange(index, set.reps + 1)}
                />
              </View>
            </View>

            <View className="flex-1 items-center">
              <Text className="mb-1 text-center text-[11px] text-ink-muted">
                {t.weightKgLabel.replace(/kg/i, weightUnit)}
              </Text>
              <View
                className={`h-10 flex-row items-center justify-center rounded-full px-3 ${tone === "raised" ? "bg-raised" : "bg-line"}`}
              >
                <StepButton
                  icon="remove"
                  label="-1"
                  onPress={() =>
                    handleSetWeightChange(index, toKg(fromKg(set.weight) - 1))
                  }
                />
                <NumericInput
                  className="h-10 w-12 px-0 py-0 text-center text-[15px] font-semibold text-ink"
                  value={fromKg(set.weight)}
                  onValueChange={(value) => handleSetWeightChange(index, toKg(value))}
                  decimal
                  maxLength={5}
                />
                <StepButton
                  icon="add"
                  label="+1"
                  onPress={() =>
                    handleSetWeightChange(index, toKg(fromKg(set.weight) + 1))
                  }
                />
              </View>
            </View>

            {exercise.sets.length > 1 && (
              <PressableScale
                onPress={() => handleRemoveSet(index)}
                accessibilityRole="button"
                accessibilityLabel={format(t.removeSetN, { n: index + 1 })}
                className="h-10 w-[18px] items-center justify-center self-center"
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={WorkoutTheme.text.primary}
                />
              </PressableScale>
            )}
          </View>
        ))}
      </View>

      {defaultRestSeconds !== undefined ? (
        <View
          className={`flex-row items-center gap-3 rounded-tile px-3 py-2 ${tone === "raised" ? "bg-surface" : "bg-background"}`}
        >
          <Ionicons name="hourglass-outline" size={18} color={WorkoutTheme.text.tertiary} />
          <Text className="flex-1 text-sm font-medium text-ink-muted" numberOfLines={1}>
            {t.restBetweenSets}
          </Text>
          <NumericInput
            className={`h-10 w-20 rounded-full px-2 py-0 text-center text-[15px] font-semibold text-ink ${tone === "raised" ? "bg-raised" : "bg-surface"}`}
            value={exercise.plannedRestSeconds ?? defaultRestSeconds}
            onValueChange={(value) =>
              onUpdate({ ...exercise, plannedRestSeconds: Math.min(600, Math.max(0, value)) })
            }
            maxLength={3}
          />
          <Text className="text-sm text-ink-muted">s</Text>
        </View>
      ) : null}
    </View>
  );
}
