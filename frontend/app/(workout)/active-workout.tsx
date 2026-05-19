import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  TextInput,
  AsyncStorage,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import { TokenService } from "@/services/token.service";
import { getWorkoutById, WorkoutExercise } from "@/services/workouts.service";
import {
  createCompletedWorkout,
  CompletedExercise,
} from "@/services/completed-workouts.service";
import WorkoutSessionHeader from "@/components/workout/WorkoutSessionHeader";
import CurrentExerciseSection, {
  CompletedSet as CompletedSetType,
} from "@/components/workout/CurrentExerciseSection";
import OtherExercisesSection from "@/components/workout/OtherExercisesSection";

interface ExerciseState {
  exerciseData: WorkoutExercise;
  completedSetIndices: number[];
  completedSets: CompletedSetType[];
  restTimeSeconds: number;
}

export default function ActiveWorkoutScreen() {
  const params = useLocalSearchParams();
  const workoutId = params.workoutId as string;
  const workoutName = params.workoutName as string;

  const [exercisesState, setExercisesState] = useState<ExerciseState[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [totalWorkoutTime, setTotalWorkoutTime] = useState(0);
  const [showRestScreen, setShowRestScreen] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionTitle, setCompletionTitle] = useState("");
  const [completionDescription, setCompletionDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  const loadWorkout = useCallback(async () => {
    try {
      setLoading(true);
      const token = await TokenService.get();
      const data = await getWorkoutById(workoutId, token || undefined);

      // Initialize exercises state
      const initialState: ExerciseState[] = data.exercises.map((ex) => ({
        exerciseData: ex,
        completedSetIndices: [],
        completedSets: [],
        restTimeSeconds: ex.plannedRestSeconds || 90,
      }));
      setExercisesState(initialState);
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Impossible de charger la séance");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  // Load workout data
  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  // Main timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!showRestScreen) {
      interval = setInterval(() => {
        setTotalWorkoutTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showRestScreen]);

  // Rest timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (showRestScreen && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            setShowRestScreen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showRestScreen, restTimeRemaining]);

  const currentExerciseState = exercisesState[currentExerciseIndex];
  const currentExercise = currentExerciseState?.exerciseData;
  const isLastExercise = currentExerciseIndex === exercisesState.length - 1;
  const isLastSet = currentSetIndex === (currentExercise?.sets.length || 1) - 1;

  const handleCompleteSet = (reps: number, weight: number) => {
    const newState = [...exercisesState];
    const exState = newState[currentExerciseIndex];

    // Track completed set
    exState.completedSetIndices.push(currentSetIndex);
    exState.completedSets.push({ reps, weight });

    // Set rest time
    const restTime = exState.restTimeSeconds || 90;
    setRestTimeRemaining(restTime);
    setShowRestScreen(true);

    if (isLastSet) {
      // Mark exercise as completed
      setCompletedExercises([...completedExercises, currentExerciseIndex]);

      if (isLastExercise) {
        // Finish workout
        setTimeout(
          () => {
            setShowCompletionModal(true);
          },
          restTime * 1000 + 500,
        );
      } else {
        // Move to next exercise
        setTimeout(
          () => {
            setExercisesState(newState);
            setCurrentExerciseIndex(currentExerciseIndex + 1);
            setCurrentSetIndex(0);
          },
          restTime * 1000 + 500,
        );
      }
    } else {
      // Move to next set
      setTimeout(
        () => {
          setExercisesState(newState);
          setCurrentSetIndex(currentSetIndex + 1);
        },
        restTime * 1000 + 500,
      );
    }

    setExercisesState(newState);
  };

  const handleAddSet = () => {
    const newState = [...exercisesState];
    const exState = newState[currentExerciseIndex];
    const lastSet =
      exState.exerciseData.sets[exState.exerciseData.sets.length - 1];
    exState.exerciseData.sets.push({ ...lastSet });
    setExercisesState(newState);
  };

  const handleRemoveSet = () => {
    const newState = [...exercisesState];
    const exState = newState[currentExerciseIndex];
    if (exState.exerciseData.sets.length > 1) {
      exState.exerciseData.sets.pop();
      if (currentSetIndex >= exState.exerciseData.sets.length) {
        setCurrentSetIndex(exState.exerciseData.sets.length - 1);
      }
      setExercisesState(newState);
    }
  };

  const handleSkipExercise = () => {
    if (isLastExercise) {
      setShowCompletionModal(true);
    } else {
      setCompletedExercises([...completedExercises, currentExerciseIndex]);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    }
  };

  const handleSelectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setCurrentSetIndex(0);
  };

  const handleAddExercise = (exercise: WorkoutExercise) => {
    const newState = [...exercisesState];
    newState.push({
      exerciseData: exercise,
      completedSetIndices: [],
      completedSets: [],
      restTimeSeconds: exercise.plannedRestSeconds || 90,
    });
    setExercisesState(newState);
  };

  const handleEndWorkout = () => {
    Alert.alert(
      "Terminer la séance",
      "Êtes-vous sûr de vouloir terminer cette séance maintenant?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Terminer",
          onPress: () => setShowCompletionModal(true),
          style: "destructive",
        },
      ],
    );
  };

  const handleMinimize = () => {
    router.push("/(tabs)/workout-trigger");
  };

  const handleSubmitCompletion = async () => {
    if (!completionTitle.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un titre");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await TokenService.get();

      // Build completed exercises (only those that were actually done)
      const completedData: CompletedExercise[] = exercisesState
        .map((state, index) => {
          if (state.completedSets.length === 0) return null;
          return {
            exerciseId: state.exerciseData.exerciseId,
            sets: state.completedSets,
            timerSeconds: state.restTimeSeconds * state.completedSets.length,
          };
        })
        .filter((ex): ex is CompletedExercise => ex !== null);

      const request = {
        title: completionTitle,
        completionDate: new Date().toISOString(),
        totalDurationSeconds: totalWorkoutTime,
        description: completionDescription,
        exercises: completedData,
      };

      await createCompletedWorkout(request, token || undefined);
      Alert.alert("Succès", "Séance enregistrée avec succès!", [
        {
          text: "OK",
          onPress: () => router.push("/(tabs)/stats"),
        },
      ]);
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Impossible d'enregistrer la séance");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: WorkoutTheme.backgroundSecondary }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (showRestScreen) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: WorkoutTheme.backgroundSecondary }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={WorkoutTheme.backgroundSecondary}
        />
        <Modal
          visible={showRestScreen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                backgroundColor: WorkoutTheme.backgroundSecondary,
                borderRadius: 20,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: WorkoutTheme.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: WorkoutTheme.text.secondary,
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Temps de repos
              </Text>
              <Text
                style={{
                  fontSize: 72,
                  fontWeight: "700",
                  color: WorkoutTheme.accent.purple,
                  textAlign: "center",
                }}
              >
                {restTimeRemaining}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: WorkoutTheme.text.secondary,
                  marginTop: 8,
                  marginBottom: 24,
                }}
              >
                secondes
              </Text>

              {/* Skip rest button */}
              <TouchableOpacity
                onPress={() => setShowRestScreen(false)}
                style={{
                  backgroundColor: WorkoutTheme.accent.purple,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="play-forward" size={16} color="white" />
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Passer le repos
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: WorkoutTheme.backgroundSecondary }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={WorkoutTheme.backgroundSecondary}
      />

      {/* Header */}
      <WorkoutSessionHeader
        workoutTitle={workoutName}
        totalTime={totalWorkoutTime}
        onMinimize={handleMinimize}
        onEndWorkout={handleEndWorkout}
      />

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {currentExercise && (
          <>
            {/* Current Exercise Section */}
            <CurrentExerciseSection
              exerciseName={currentExercise.exerciseName || "Exercice"}
              currentSetIndex={currentSetIndex}
              totalSets={currentExercise.sets.length}
              plannedSetData={currentExercise.sets}
              completedSets={currentExerciseState.completedSets}
              onCompleteSet={handleCompleteSet}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onSkipExercise={handleSkipExercise}
              isLastExercise={isLastExercise}
              isLastSet={isLastSet}
            />

            {/* Other Exercises Section */}
            <OtherExercisesSection
              exercises={exercisesState.map((s) => s.exerciseData)}
              currentExerciseIndex={currentExerciseIndex}
              onSelectExercise={handleSelectExercise}
              onAddExercise={handleAddExercise}
              completedExercises={completedExercises}
            />
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: WorkoutTheme.backgroundSecondary,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "90%",
              paddingHorizontal: 16,
              paddingVertical: 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={WorkoutTheme.status.success}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: WorkoutTheme.text.primary,
                  marginTop: 16,
                }}
              >
                Séance complétée!
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: WorkoutTheme.text.secondary,
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Titre
                </Text>
                <TextInput
                  style={{
                    backgroundColor: WorkoutTheme.backgroundTertiary,
                    borderWidth: 1,
                    borderColor: WorkoutTheme.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: WorkoutTheme.text.primary,
                  }}
                  placeholder="Nom de la séance"
                  placeholderTextColor={WorkoutTheme.text.tertiary}
                  value={completionTitle}
                  onChangeText={setCompletionTitle}
                  editable={!isSubmitting}
                />
              </View>

              {/* Description Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: WorkoutTheme.text.secondary,
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Description (optionnel)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: WorkoutTheme.backgroundTertiary,
                    borderWidth: 1,
                    borderColor: WorkoutTheme.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 14,
                    color: WorkoutTheme.text.primary,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Ajouter une description..."
                  placeholderTextColor={WorkoutTheme.text.tertiary}
                  value={completionDescription}
                  onChangeText={setCompletionDescription}
                  multiline
                  editable={!isSubmitting}
                />
              </View>

              {/* Buttons */}
              <View style={{ gap: 12, marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={handleSubmitCompletion}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: WorkoutTheme.accent.purple,
                    borderRadius: 10,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="white" />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "white",
                        }}
                      >
                        Enregistrer
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCompletionModal(false)}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: WorkoutTheme.backgroundTertiary,
                    borderRadius: 10,
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: WorkoutTheme.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: WorkoutTheme.text.secondary,
                    }}
                  >
                    Retour
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
