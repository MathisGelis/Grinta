import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { WorkoutExercise } from "@/services/workouts.service";
import { Exercise } from "@/services/exercises.service";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";
import { useTranslation } from "@/contexts/LanguageContext";

import PressableScale from "@/components/ui/PressableScale";
import { format } from "@/i18n/translations";
interface OtherExercisesSectionProps {
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  onSelectExercise: (index: number) => void;
  onAddExercise: (exercise: WorkoutExercise) => void;
  completedExercises: number[];
}

export default function OtherExercisesSection({
  exercises,
  currentExerciseIndex,
  onSelectExercise,
  onAddExercise,
  completedExercises,
}: OtherExercisesSectionProps) {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ reps: 10, weight: 0 }],
      plannedRestSeconds: 90,
    };
    onAddExercise(newExercise);
    setShowAddModal(false);
  };

  const otherExercises = exercises.filter(
    (_, index) => index !== currentExerciseIndex,
  );

  return (
    <>
      <View className="my-3 gap-4">
        <View className="flex-row items-center justify-between px-5">
          <Text className="text-xl font-semibold text-ink">
            {t.otherExercises}
            <Text className="text-base font-normal text-ink-muted">
              {" "}
              {otherExercises.length}
            </Text>
          </Text>
          <PressableScale
            onPress={() => setShowAddModal(true)}
            accessibilityRole="button"
            accessibilityLabel={t.add}
            className="h-10 flex-row items-center gap-1.5 rounded-full bg-accent px-4"
          >
            <Ionicons name="add" size={18} color={WorkoutTheme.text.primary} />
            <Text className="text-sm font-semibold text-ink">{t.add}</Text>
          </PressableScale>
        </View>

        {otherExercises.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerClassName="gap-3 px-5"
          >
            {otherExercises.map((exercise) => {
              const realIndex = exercises.findIndex(
                (e) => e.exerciseId === exercise.exerciseId,
              );
              const isCompleted = completedExercises.includes(realIndex);

              return (
                <PressableScale
                  key={exercise.exerciseId}
                  onPress={() => onSelectExercise(realIndex)}
                  accessibilityRole="button"
                  accessibilityLabel={exercise.exerciseName}
                  className={`w-[156px] gap-3 rounded-tile p-4 ${isCompleted ? "bg-success-tint" : "bg-surface"}`}
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${isCompleted ? "bg-success/20" : "bg-accent-tint"}`}
                  >
                    <Ionicons
                      name={isCompleted ? "checkmark" : "barbell"}
                      size={18}
                      color={
                        isCompleted
                          ? WorkoutTheme.status.success
                          : WorkoutTheme.accent.purple
                      }
                    />
                  </View>
                  <View>
                    <Text
                      className="text-sm font-semibold text-ink"
                      numberOfLines={2}
                    >
                      {exercise.exerciseName}
                    </Text>
                    <Text className="mt-0.5 text-xs text-ink-muted">
                      {format(t.setsCount, { n: exercise.sets.length })}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        ) : (
          <View className="mx-5 items-center rounded-card bg-surface p-6">
            <Text className="text-sm text-ink-muted">{t.noOtherExercise}</Text>
          </View>
        )}
      </View>

      <ExerciseSearch
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectExercise={handleAddExercise}
        existingExerciseIds={exercises.map((e) => e.exerciseId)}
      />
    </>
  );
}
