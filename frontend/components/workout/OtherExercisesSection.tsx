import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { WorkoutExercise } from "@/services/workouts.service";
import { Exercise } from "@/services/exercises.service";
import ExerciseSearch from "@/components/workout/ExerciseSearch";

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
      <View
        style={{
          backgroundColor: WorkoutTheme.backgroundTertiary,
          paddingHorizontal: 16,
          paddingVertical: 16,
          marginHorizontal: 16,
          marginVertical: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: WorkoutTheme.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: WorkoutTheme.text.primary,
            }}
          >
            Autres exercices ({otherExercises.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              backgroundColor: WorkoutTheme.accent.purple,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
            }}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "white",
                textAlign: "center",
                marginLeft: 6,
              }}
            >
              Ajouter
            </Text>
          </TouchableOpacity>
        </View>

        {otherExercises.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              {otherExercises.map((exercise, index) => {
                const realIndex = exercises.findIndex(
                  (e) => e.exerciseId === exercise.exerciseId,
                );
                const isCompleted = completedExercises.includes(realIndex);

                return (
                  <TouchableOpacity
                    key={exercise.exerciseId}
                    onPress={() => onSelectExercise(realIndex)}
                    style={{
                      backgroundColor: isCompleted
                        ? WorkoutTheme.status.success + "20"
                        : WorkoutTheme.background,
                      borderRadius: 10,
                      padding: 12,
                      borderWidth: 2,
                      borderColor: isCompleted
                        ? WorkoutTheme.status.success
                        : WorkoutTheme.border,
                      minWidth: 140,
                      maxWidth: 140,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="barbell"
                        size={14}
                        color={
                          isCompleted
                            ? WorkoutTheme.status.success
                            : WorkoutTheme.accent.purple
                        }
                      />
                      {isCompleted && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={WorkoutTheme.status.success}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: WorkoutTheme.text.primary,
                      }}
                      numberOfLines={2}
                    >
                      {exercise.exerciseName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "500",
                        color: WorkoutTheme.text.secondary,
                        marginTop: 6,
                      }}
                    >
                      {exercise.sets.length} séries
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <Text
              style={{
                fontSize: 13,
                color: WorkoutTheme.text.secondary,
              }}
            >
              Aucun autre exercice
            </Text>
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
