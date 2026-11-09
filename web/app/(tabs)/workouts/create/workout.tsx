import React, { useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";
import { Exercise, getExerciseStats } from "@/services/exercises.service";
import { ExerciseSetupData } from "@/components/workout/exercises/ExerciseSetupItem";
import {
  createPlannedWorkout,
  getWorkoutById,
  plannedWorkoutsList,
  PlannedWorkout,
  CreateWorkoutRequest,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";
import WorkoutFormFields from "@/components/workout/editor/WorkoutFormFields";
import ExerciseSection from "@/components/workout/editor/ExerciseSection";
import WorkoutPickerSheet from "@/components/workout/editor/WorkoutPickerSheet";
import WorkoutStats from "@/components/workout/editor/WorkoutStats";

import Button from "@/components/ui/Button";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
export default function CreateWorkoutScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useFloatingHeaderHeight();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseSetupData[]
  >([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("45");
  const [restSeconds, setRestSeconds] = useState("60");
  const [loading, setLoading] = useState(false);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>(
    () => plannedWorkoutsList.peek() ?? [],
  );

  const openWorkoutPicker = () => {
    setShowWorkoutPicker(true);
    plannedWorkoutsList.load().then(setWorkouts).catch(() => {});
  };

  const handleImportWorkout = async (workout: PlannedWorkout) => {
    setShowWorkoutPicker(false);
    try {
      const token = await TokenService.get();
      const detail = await getWorkoutById(workout.id, token || undefined);
      setSelectedExercises((prev) => {
        const known = new Set(prev.map((ex) => ex.id));
        const added = detail.exercises
          .filter((ex) => !known.has(ex.exerciseId))
          .map((ex) => ({
            id: ex.exerciseId,
            name: ex.exerciseName ?? "",
            sets: ex.sets.length ? ex.sets : [{ reps: 10, weight: 0 }],
          }));
        return [...prev, ...added];
      });
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    }
  };

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

    getExerciseStats(exercise.id)
      .then((stats) => {
        const weight = stats?.lastWeight;
        if (!weight) return;
        setSelectedExercises((prev) =>
          prev.map((ex) =>
            ex.id === exercise.id && ex.sets.every((set) => set.weight === 0)
              ? { ...ex, sets: ex.sets.map((set) => ({ ...set, weight })) }
              : ex,
          ),
        );
      })
      .catch(() => {});
  };

  const handleUpdateExercise = (updated: ExerciseSetupData) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.id === updated.id ? updated : ex)),
    );
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const estimatedMinutes = Math.min(600, Math.max(0, parseInt(estimatedTime, 10) || 0));

  const transformExercisesToAPI = (): CreateWorkoutRequest => ({
    title: name.trim(),
    description: description.trim(),
    ...(estimatedMinutes ? { estimatedDurationMinutes: estimatedMinutes } : {}),
    exercises: selectedExercises.map((exercise) => ({
      exerciseId: exercise.id,
      sets: exercise.sets,
      plannedRestSeconds: Math.min(600, Math.max(0, parseInt(restSeconds, 10) || 0)),
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
      <ScreenBackground flat />
      <ScreenHeader floating title={t.newSession} />
      <ScrollView {...chromeScrollProps}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 px-5"
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <WorkoutFormFields
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          estimatedTime={estimatedTime}
          onEstimatedTimeChange={setEstimatedTime}
          restSeconds={restSeconds}
          onRestSecondsChange={setRestSeconds}
        />

        <ExerciseSection
          exercises={selectedExercises}
          onAdd={() => setShowExerciseSelector(true)}
          onImport={openWorkoutPicker}
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

      <WorkoutPickerSheet
        visible={showWorkoutPicker}
        workouts={workouts}
        onClose={() => setShowWorkoutPicker(false)}
        onSelect={handleImportWorkout}
        onCreate={() => {
          setShowWorkoutPicker(false);
          router.push("/(tabs)/workouts/create/workout");
        }}
      />

      <ExerciseSearch
        visible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleSelectExercise}
        existingExerciseIds={selectedExercises.map((ex) => ex.id)}
      />
    </View>
  );
}
