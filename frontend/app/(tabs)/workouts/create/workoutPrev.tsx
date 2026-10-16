import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";
import { Exercise } from "@/services/exercises.service";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/exercises/ExerciseSetupItem";
import {
  createPlannedWorkout,
  CreateWorkoutRequest,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";

import PressableScale from "@/components/ui/PressableScale";
export default function CreateWorkoutScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseSetupData[]
  >([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("45");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    const exerciseExists = selectedExercises.some(
      (ex) => ex.id === exercise.id,
    );

    if (exerciseExists) {
      Alert.alert(t.duplicateExercise, `"${exercise.name}" ${t.alreadyAdded}`);
      return;
    }

    const newExercise: ExerciseSetupData = {
      id: exercise.id,
      name: exercise.name,
      sets: [
        {
          reps: 10,
          weight: 0,
        },
      ],
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (updated: ExerciseSetupData) => {
    setSelectedExercises(
      selectedExercises.map((ex) => (ex.id === updated.id ? updated : ex)),
    );
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter((ex) => ex.id !== id));
  };

  const calculateTotalWeight = () => {
    return selectedExercises.reduce((total, ex) => {
      const exerciseWeight = ex.sets.reduce((sum, set) => {
        return sum + set.weight * set.reps;
      }, 0);
      return total + exerciseWeight;
    }, 0);
  };

  const transformExercisesToAPI = (): CreateWorkoutRequest => {
    return {
      title: name.trim(),
      description: description.trim(),
      exercises: selectedExercises.map((exercise) => ({
        exerciseId: exercise.id,
        sets: exercise.sets,
        plannedRestSeconds: 60,
      })),
    };
  };

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
      const workoutData = transformExercisesToAPI();

      await createPlannedWorkout(workoutData, token || undefined);

      Alert.alert(t.success, t.workoutCreated, [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.creationError;
      Alert.alert(t.error, message);
      console.error("Erreur de création:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 pb-5">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="mt-5">
          <Text className="text-sm font-bold text-ink mb-2">
            {t.workoutNameLabel}
          </Text>
          <View className="flex-row items-center bg-surface rounded-xl px-3 border border-line gap-2 h-12">
            <Ionicons
              name="barbell"
              size={18}
              color={WorkoutTheme.accent.purple}
            />
            <TextInput
              placeholder={t.workoutNamePlaceholder}
              placeholderTextColor={WorkoutTheme.text.tertiary}
              className="flex-1 text-ink text-sm"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View className="mt-5">
          <Text className="text-sm font-bold text-ink mb-2">
            {t.descriptionLabel}
          </Text>
          <TextInput
            placeholder={t.descriptionPlaceholder}
            placeholderTextColor={WorkoutTheme.text.tertiary}
            multiline
            numberOfLines={4}
            className="flex-row items-start bg-surface rounded-xl px-3 border border-line gap-2 h-[100px] py-3 pt-3"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View className="mt-5">
          <Text className="text-sm font-bold text-ink mb-2">
            {t.photoLabel}
          </Text>
          <PressableScale
            onPress={pickImage}
            className="rounded-xl overflow-hidden bg-surface border-[2px] border-line border-dashed h-40"
          >
            {image ? (
              <Image source={{ uri: image }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full justify-center items-center gap-2">
                <Ionicons
                  name="image-outline"
                  size={40}
                  color={WorkoutTheme.accent.purple}
                />
                <Text className="text-ink-soft text-[13px] font-medium">
                  {t.addPhoto}
                </Text>
              </View>
            )}
          </PressableScale>
        </View>

        <View className="mt-5">
          <Text className="text-sm font-bold text-ink mb-2">
            {t.estimatedDuration}
          </Text>
          <View className="flex-row items-center bg-surface rounded-xl px-3 border border-line gap-2 h-12">
            <Ionicons
              name="time"
              size={18}
              color={WorkoutTheme.accent.purple}
            />
            <TextInput
              placeholder="45"
              placeholderTextColor={WorkoutTheme.text.tertiary}
              className="flex-1 text-ink text-sm"
              value={estimatedTime}
              onChangeText={setEstimatedTime}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text className="text-ink-soft text-xs font-semibold">min</Text>
          </View>
        </View>

        <View className="mt-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm font-bold text-ink mb-2">
              {t.exercises} ({selectedExercises.length})
            </Text>
            <PressableScale
              onPress={() => setShowExerciseSelector(true)}
              className="px-2.5 py-2 ml-2 items-center justify-center"
            >
              <Ionicons
                name="add-circle"
                size={24}
                color={WorkoutTheme.accent.purple}
              />
            </PressableScale>
          </View>

          {selectedExercises.length > 0 ? (
            <View>
              {selectedExercises.map((exercise) => (
                <ExerciseSetupItem
                  key={exercise.id}
                  exercise={exercise}
                  onUpdate={handleUpdateExercise}
                  onRemove={() => handleRemoveExercise(exercise.id)}
                />
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl py-8 items-center gap-3 border border-line">
              <Ionicons
                name="barbell"
                size={40}
                color={WorkoutTheme.text.tertiary}
              />
              <Text className="text-sm font-semibold text-ink-soft">
                {t.noExercisesAdded}
              </Text>
              <Text className="text-xs text-ink-muted">
                {t.tapToAddExercise}
              </Text>
            </View>
          )}
        </View>

        {selectedExercises.length > 0 && (
          <View className="mt-6 mb-5">
            <Text className="text-sm font-bold text-ink mb-3">
              {t.estimatedStats}
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1 bg-surface rounded-xl px-3 py-3.5 items-center border border-line gap-1.5">
                <Ionicons
                  name="barbell"
                  size={20}
                  color={WorkoutTheme.accent.purple}
                />
                <Text className="text-base font-bold text-accent">
                  {calculateTotalWeight().toFixed(0)}kg
                </Text>
                <Text className="text-[11px] text-ink-soft">
                  {t.totalWeight}
                </Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl px-3 py-3.5 items-center border border-line gap-1.5">
                <Ionicons
                  name="repeat"
                  size={20}
                  color={WorkoutTheme.accent.purple}
                />
                <Text className="text-base font-bold text-accent">
                  {selectedExercises.reduce(
                    (sum, ex) => sum + ex.sets.length,
                    0,
                  )}
                </Text>
                <Text className="text-[11px] text-ink-soft">{t.sets}</Text>
              </View>
              <View className="flex-1 bg-surface rounded-xl px-3 py-3.5 items-center border border-line gap-1.5">
                <Ionicons
                  name="timer"
                  size={20}
                  color={WorkoutTheme.accent.purple}
                />
                <Text className="text-base font-bold text-accent">
                  {estimatedTime}m
                </Text>
                <Text className="text-[11px] text-ink-soft">{t.duration}</Text>
              </View>
            </View>
          </View>
        )}

        <PressableScale
          onPress={createWorkout}
          disabled={loading}
          className={`bg-accent rounded-xl py-3.5 mt-4 flex-row justify-center items-center gap-2 ${loading ? "opacity-[0.6]" : ""}`}
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
              <Text className="text-ink text-base font-bold">
                {t.createWorkoutBtn}
              </Text>
            </>
          )}
        </PressableScale>

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
