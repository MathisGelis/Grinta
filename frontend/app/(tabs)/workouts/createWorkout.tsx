import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSearch from "@/components/workoutCreation/ExerciseSearch";
import { Exercise } from "@/services/exercises.service";
import { ExerciseSetupData } from "@/components/workoutCreation/ExerciseSetupItem";
import {
  createPlannedWorkout,
  CreateWorkoutRequest,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";
import WorkoutFormFields from "@/components/workoutCreation/workout/WorkoutFormFields";
import ExerciseSection from "@/components/workoutCreation/workout/ExerciseSection";
import WorkoutStats from "@/components/workoutCreation/workout/WorkoutStats";

export default function CreateWorkoutScreen() {
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
        "Exercice en doublon",
        `"${exercise.name}" est déjà ajouté à la séance.`,
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
      Alert.alert("Erreur", "Veuillez entrer un nom de séance");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins un exercice");
      return;
    }

    setLoading(true);
    try {
      const token = await TokenService.get();
      await createPlannedWorkout(transformExercisesToAPI(), token || undefined);
      Alert.alert("Succès", "Séance créée avec succès!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la création";
      Alert.alert("Erreur", message);
      console.error("Erreur de création:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 pb-5"
      style={{ backgroundColor: WorkoutTheme.background }}
    >
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
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

        {/* Bouton de création */}
        <TouchableOpacity
          onPress={createWorkout}
          disabled={loading}
          className="rounded-xl py-3.5 mt-4 flex-row justify-center items-center gap-2"
          style={[
            { backgroundColor: WorkoutTheme.accent.purple },
            loading && { opacity: 0.6 },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={WorkoutTheme.text.primary} />
          ) : (
            <>
              <Ionicons
                name="checkmark-done"
                size={20}
                color={WorkoutTheme.text.primary}
              />
              <Text
                className="text-base font-bold"
                style={{ color: WorkoutTheme.text.primary }}
              >
                Créer la séance
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="h-5" />
      </ScrollView>

      <ExerciseSearch
        visible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleSelectExercise}
        existingExerciseIds={selectedExercises.map((ex) => ex.id)}
      />
    </SafeAreaView>
  );
}
