import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";
import { Exercise } from "@/services/exercises.service";
import { ExerciseSetupData } from "@/components/workout/exercises/ExerciseSetupItem";
import {
  createPlannedWorkout,
  CreateWorkoutRequest,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";
import WorkoutFormFields from "@/components/workout/editor/WorkoutFormFields";
import ExerciseSection from "@/components/workout/editor/ExerciseSection";
import WorkoutStats from "@/components/workout/editor/WorkoutStats";

import Button from "@/components/ui/Button";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
export default function CreateWorkoutScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseSetupData[]
  >([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("45");
  const [loading, setLoading] = useState(false);

  const handleSelectExercise = (exercise: Exercise) => {
    const exerciseExists = selectedExercises.some(
      (ex) => ex.id === exercise.id,
    );

    if (exerciseExists) {
      Alert.alert(
        t.duplicateExercise,
        `"${exercise.name}" ${t.alreadyAdded}`,
      );
      return;
    }

    const newExercise: ExerciseSetupData = {
      id: exercise.id,
      name: exercise.name,
      sets: [{ reps: 10, weight: 0 }],
    };
    setSelectedExercises((prev) => [...prev, newExercise]);
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (updated: ExerciseSetupData) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.id === updated.id ? updated : ex)),
    );
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const transformExercisesToAPI = (): CreateWorkoutRequest => ({
    title: name.trim(),
    description: description.trim(),
    exercises: selectedExercises.map((exercise) => ({
      exerciseId: exercise.id,
      sets: exercise.sets,
      plannedRestSeconds: 60,
    })),
  });

  const createWorkout = async () => {
    if (!name.trim()) {
      Alert.alert(t.error, t.errorWorkoutName);
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert(t.error, t.errorNoExercises);
      return;
    }

    setLoading(true);
    try {
      const token = await TokenService.get();
      await createPlannedWorkout(transformExercisesToAPI(), token || undefined);
      Alert.alert(t.success, t.workoutCreated, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t.creationError;
      Alert.alert(t.error, message);
      console.error("Erreur de création:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScreenBackground />
      <ScreenHeader title={t.newSession} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 px-5"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <WorkoutFormFields
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          image={image}
          onImageChange={setImage}
          estimatedTime={estimatedTime}
          onEstimatedTimeChange={setEstimatedTime}
        />

        <ExerciseSection
          exercises={selectedExercises}
          onAdd={() => setShowExerciseSelector(true)}
          onUpdate={handleUpdateExercise}
          onRemove={handleRemoveExercise}
        />

        {selectedExercises.length > 0 && (
          <WorkoutStats
            exercises={selectedExercises}
            estimatedTime={estimatedTime}
          />
        )}

        <Button
          icon="checkmark-done"
          label={t.createWorkoutBtn}
          loading={loading}
          onPress={createWorkout}
        />
      </ScrollView>

      <ExerciseSearch
        visible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleSelectExercise}
        existingExerciseIds={selectedExercises.map((ex) => ex.id)}
      />
    </View>
  );
}
