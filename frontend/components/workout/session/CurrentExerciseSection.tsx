import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";

import type { ExerciseStats } from "@/services/exercises.service";
import PressableScale from "@/components/ui/PressableScale";
import Button from "@/components/ui/Button";
export interface CompletedSet {
  reps: number;
  weight: number;
}

interface CurrentExerciseSectionProps {
  exerciseName: string;
  currentSetIndex: number;
  totalSets: number;
  plannedSetData: CompletedSet[];
  completedSets: CompletedSet[];
  onCompleteSet: (reps: number, weight: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onSkipExercise: () => void;
  onDeleteExercise?: () => void;
  isLastExercise: boolean;
  isLastSet: boolean;
  lastStats?: ExerciseStats | null;
}

export default function CurrentExerciseSection({
  exerciseName,
  currentSetIndex,
  totalSets,
  plannedSetData,
  completedSets,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  onSkipExercise,
  onDeleteExercise,
  isLastExercise,
  isLastSet,
  lastStats,
}: CurrentExerciseSectionProps) {
  const { t } = useTranslation();
  const initialValues = (index: number) => {
    const planned = plannedSetData[index];
    return {
      weight: planned?.weight || lastStats?.last_weight || 0,
      reps: planned?.reps || lastStats?.last_reps || 0,
    };
  };
  const [weight, setWeight] = useState(initialValues(currentSetIndex).weight.toString());
  const [reps, setReps] = useState(initialValues(currentSetIndex).reps.toString());

  const lastWeight = lastStats?.last_weight;
  const lastReps = lastStats?.last_reps;

  useEffect(() => {
    const planned = plannedSetData[currentSetIndex];
    setWeight(String(planned?.weight || lastWeight || 0));
    setReps(String(planned?.reps || lastReps || 1));
  }, [currentSetIndex, plannedSetData, lastWeight, lastReps]);

  const handleCompleteSet = () => {
    const w = parseFloat(weight) || 0;
    const r = Math.max(1, parseInt(reps) || 1);
    onCompleteSet(r, w);
  };

  const handleDeleteExercise = () => {
    Alert.alert(
      t.deleteExercise,
      t.deleteExerciseConfirm,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          onPress: () => onDeleteExercise?.(),
          style: "destructive",
        },
      ],
    );
  };

  return (
    <View className="mx-5 my-3 gap-6 rounded-hero bg-surface p-5">
      <View className="items-center">
        <Text className="mb-1 text-sm text-ink-muted">{t.currentExercise}</Text>
        <Text className="text-center text-2xl font-semibold text-ink">
          {exerciseName}
        </Text>
      </View>

      {lastStats && (lastStats.last_weight != null || lastStats.PR != null) ? (
        <View className="flex-row gap-3">
          {lastStats.last_weight != null ? (
            <View className="flex-1 rounded-tile bg-raised px-4 py-3">
              <Text className="text-xs text-ink-muted">{t.lastPerformanceLabel}</Text>
              <Text className="mt-0.5 text-base font-semibold text-ink">
                {lastStats.last_weight} kg
                {lastStats.last_reps != null ? ` × ${lastStats.last_reps}` : ""}
              </Text>
            </View>
          ) : null}
          {lastStats.PR != null ? (
            <View className="flex-1 rounded-tile bg-accent-tint px-4 py-3">
              <Text className="text-xs text-accent-text">{t.personalRecordLabel}</Text>
              <Text className="mt-0.5 text-base font-semibold text-ink">
                {lastStats.PR} kg
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <View className="flex-1 items-center rounded-card bg-raised px-3 py-5">
          <Text className="mb-2 text-xs text-ink-muted">{t.weightLabel}</Text>
          <TextInput
            className="w-full py-0 text-center text-[40px] font-semibold text-ink"
            style={{ fontVariant: ["tabular-nums"], height: 52 }}
            value={weight}
            onChangeText={setWeight}
            onBlur={() => !weight.trim() && setWeight("0")}
            selectTextOnFocus
            keyboardType="decimal-pad"
            maxLength={5}
          />
          <Text className="mt-1 text-sm text-ink-muted">kg</Text>
        </View>
        <View className="flex-1 items-center rounded-card bg-accent-tint px-3 py-5">
          <Text className="mb-2 text-xs text-accent-text">{t.repsLabel}</Text>
          <TextInput
            className="w-full py-0 text-center text-[40px] font-semibold text-ink"
            style={{ fontVariant: ["tabular-nums"], height: 52 }}
            value={reps}
            onChangeText={setReps}
            onBlur={() => !(parseInt(reps, 10) >= 1) && setReps("1")}
            selectTextOnFocus
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text className="mt-1 text-sm text-accent-text">{t.repsUnit}</Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-ink">
            {t.setLabel} {currentSetIndex + 1}
            <Text className="font-normal text-ink-muted"> / {totalSets}</Text>
          </Text>
          <View className="flex-row gap-2">
            <PressableScale
              onPress={onRemoveSet}
              disabled={totalSets <= 1}
              accessibilityRole="button"
              accessibilityLabel={t.removeASet}
              className={`h-10 w-10 items-center justify-center rounded-full bg-raised ${totalSets <= 1 ? "opacity-40" : ""}`}
            >
              <Ionicons
                name="remove"
                size={18}
                color={WorkoutTheme.text.primary}
              />
            </PressableScale>
            <PressableScale
              onPress={onAddSet}
              accessibilityRole="button"
              accessibilityLabel={t.addSet}
              className="h-10 w-10 items-center justify-center rounded-full bg-accent"
            >
              <Ionicons
                name="add"
                size={18}
                color={WorkoutTheme.text.primary}
              />
            </PressableScale>
          </View>
        </View>

        <View className="flex-row gap-1.5">
          {Array.from({ length: totalSets }).map((_, index) => (
            <View
              key={index}
              className={`h-2 flex-1 rounded-full ${
                index < currentSetIndex
                  ? "bg-accent"
                  : index === currentSetIndex
                    ? "bg-accent/40"
                    : "bg-raised"
              }`}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Button
          icon="checkmark"
          label={
            isLastSet && isLastExercise
              ? t.finishWorkout
              : isLastSet
                ? t.nextExercise
                : t.nextSet
          }
          onPress={handleCompleteSet}
        />
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            variant="secondary"
            icon="arrow-forward"
            label={t.skipExercise}
            onPress={onSkipExercise}
          />
          {onDeleteExercise && (
            <PressableScale
              onPress={handleDeleteExercise}
              accessibilityRole="button"
              accessibilityLabel={t.deleteExercise}
              className="h-[52px] w-[52px] items-center justify-center rounded-full bg-danger-tint"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={WorkoutTheme.status.danger}
              />
            </PressableScale>
          )}
        </View>
      </View>
    </View>
  );
}
