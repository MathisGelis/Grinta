import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";

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
}: CurrentExerciseSectionProps) {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(
    plannedSetData[currentSetIndex]?.weight.toString() || "0",
  );
  const [reps, setReps] = useState(
    plannedSetData[currentSetIndex]?.reps.toString() || "0",
  );

  useEffect(() => {
    setWeight(plannedSetData[currentSetIndex]?.weight.toString() || "0");
    setReps(plannedSetData[currentSetIndex]?.reps.toString() || "0");
  }, [currentSetIndex, plannedSetData]);

  const handleCompleteSet = () => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
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

      <View className="flex-row gap-3">
        <View className="flex-1 items-center rounded-card bg-raised px-3 py-5">
          <Text className="mb-2 text-xs text-ink-muted">{t.weightLabel}</Text>
          <TextInput
            className="w-full py-0 text-center text-[40px] font-semibold text-ink"
            style={{ fontVariant: ["tabular-nums"], height: 52 }}
            value={weight}
            onChangeText={setWeight}
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
