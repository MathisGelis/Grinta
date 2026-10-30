import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import { TokenService } from "@/services/token.service";
import { getWorkoutById, WorkoutExercise } from "@/services/workouts.service";
import {
  createCompletedWorkout,
  CompletedExercise,
} from "@/services/completed-workouts.service";
import WorkoutSessionHeader from "@/components/workout/session/WorkoutSessionHeader";
import CurrentExerciseSection from "@/components/workout/session/CurrentExerciseSection";
import OtherExercisesSection from "@/components/workout/session/OtherExercisesSection";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  ExerciseState,
  clearActiveSession,
  elapsedSince,
  getActiveSession,
  saveActiveSession,
} from "@/services/active-session.service";

import {
  LiveExerciseStats,
  getExerciseStats,
} from "@/services/exercises.service";
import type { Badge } from "@/services/badges.service";
import ScreenBackground from "@/components/ui/ScreenBackground";
import Button from "@/components/ui/Button";
import PressableScale from "@/components/ui/PressableScale";
import { FormField, TextField } from "@/components/ui/FormField";
import WorkoutImagePicker from "@/components/workout/editor/WorkoutImagePicker";
import NewRecordsSheet from "@/components/workout/badges/NewRecordsSheet";
import { PhotoService } from "@/services/photo.service";
export default function ActiveWorkoutScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const workoutId = params.workoutId as string;
  const workoutName = params.workoutName as string;
  const isResuming = params.resume === "1";

  const [exercisesState, setExercisesState] = useState<ExerciseState[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [totalWorkoutTime, setTotalWorkoutTime] = useState(0);
  const [showRestScreen, setShowRestScreen] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [restTimeTotal, setRestTimeTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionTitle, setCompletionTitle] = useState("");
  const [completionDescription, setCompletionDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const photoFailedRef = useRef(false);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const setTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalTimeRef = useRef(0);
  const [exerciseStats, setExerciseStats] = useState<
    Record<string, LiveExerciseStats | null>
  >({});
  const sheetTranslateY = useSharedValue(0);

  useEffect(() => {
    if (showCompletionModal) sheetTranslateY.set(0);
  }, [showCompletionModal, sheetTranslateY]);

  const sheetPan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!isSubmitting)
    .activeOffsetY(10)
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      sheetTranslateY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 800) {
        setShowCompletionModal(false);
      } else {
        sheetTranslateY.set(withSpring(0));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.get() }],
  }));

  useEffect(() => {
    totalTimeRef.current = totalWorkoutTime;
  }, [totalWorkoutTime]);

  const loadWorkout = useCallback(async () => {
    try {
      setLoading(true);

      if (isResuming) {
        const stored = await getActiveSession();

        if (stored) {
          setExercisesState(stored.exercisesState);
          setCurrentExerciseIndex(stored.currentExerciseIndex);
          setCurrentSetIndex(stored.currentSetIndex);
          setCompletedExercises(stored.completedExercises);
          setTotalWorkoutTime(elapsedSince(stored));
          return;
        }
      }

      const token = await TokenService.get();
      const data = await getWorkoutById(workoutId, token || undefined);

      const initialState: ExerciseState[] = data.exercises.map((ex) => ({
        exerciseData: ex,
        completedSetIndices: [],
        completedSets: [],
        restTimeSeconds: ex.plannedRestSeconds || 90,
      }));
      setExercisesState(initialState);
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert(t.error, t.cannotLoadWorkout);
      await clearActiveSession();
      router.back();
    } finally {
      setLoading(false);
    }
  }, [t, workoutId, isResuming]);

  useEffect(() => {
    loadWorkout();

    return () => {
      if (setTimeoutRef.current) {
        clearTimeout(setTimeoutRef.current);
      }
    };
  }, [loadWorkout]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!showRestScreen && !showCompletionModal) {
      interval = setInterval(() => {
        setTotalWorkoutTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showRestScreen, showCompletionModal]);

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

  const persistSession = useCallback(async () => {
    if (exercisesState.length === 0) return;
    await saveActiveSession({
      workoutId,
      workoutName,
      exercisesState,
      currentExerciseIndex,
      currentSetIndex,
      completedExercises,
      totalWorkoutTime: totalTimeRef.current,
    });
  }, [
    workoutId,
    workoutName,
    exercisesState,
    currentExerciseIndex,
    currentSetIndex,
    completedExercises,
  ]);

  useEffect(() => {
    if (loading) return;
    void persistSession();
  }, [loading, persistSession]);

  const currentExerciseState = exercisesState[currentExerciseIndex];
  const currentExercise = currentExerciseState?.exerciseData;
  const isLastExercise = currentExerciseIndex === exercisesState.length - 1;
  const currentExerciseId = currentExercise?.exerciseId;

  useEffect(() => {
    if (!currentExerciseId || currentExerciseId in exerciseStats) return;
    let cancelled = false;
    getExerciseStats(currentExerciseId)
      .catch(() => null)
      .then((stats) => {
        if (cancelled) return;
        setExerciseStats((prev) =>
          currentExerciseId in prev ? prev : { ...prev, [currentExerciseId]: stats },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [currentExerciseId, exerciseStats]);

  const isLastSet = currentSetIndex === (currentExercise?.sets.length || 1) - 1;

  const handleCompleteSet = (reps: number, weight: number) => {
    const newState = [...exercisesState];
    const exState = newState[currentExerciseIndex];

    exState.completedSetIndices.push(currentSetIndex);
    exState.completedSets.push({ reps, weight });

    if (currentExerciseId && (weight > 0 || reps > 0)) {
      // Affichage uniquement : le serveur recalcule les stats à l'enregistrement de la séance.
      const previous = exerciseStats[currentExerciseId];
      const update: LiveExerciseStats = { lastWeight: weight, lastReps: reps };
      if (previous !== undefined && weight > (previous?.prWeight ?? 0)) {
        update.prWeight = weight;
      }
      setExerciseStats((prev) => ({
        ...prev,
        [currentExerciseId]: { ...prev[currentExerciseId], ...update },
      }));
    }

    const restTime = exState.restTimeSeconds || 90;
    setRestTimeRemaining(restTime);
    setRestTimeTotal(restTime);
    setShowRestScreen(true);
    setExercisesState(newState);

    if (setTimeoutRef.current) {
      clearTimeout(setTimeoutRef.current);
    }

    setTimeoutRef.current = setTimeout(
      () => {
        executeSetTransition(isLastSet, isLastExercise, newState);
      },
      restTime * 1000 + 500,
    );
  };

  const executeSetTransition = (
    isLastSet: boolean,
    isLastExercise: boolean,
    newState: ExerciseState[],
  ) => {
    if (isLastSet) {
      setCompletedExercises([...completedExercises, currentExerciseIndex]);

      if (isLastExercise) {
        setShowCompletionModal(true);
      } else {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSetIndex(0);
      }
    } else {
      setCurrentSetIndex(currentSetIndex + 1);
    }
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
    const newCompletedExercises = Array.isArray(completedExercises)
      ? [...completedExercises]
      : [];
    if (!newCompletedExercises.includes(currentExerciseIndex)) {
      newCompletedExercises.push(currentExerciseIndex);
    }

    let nextExerciseIndex = -1;
    for (let i = currentExerciseIndex + 1; i < exercisesState.length; i++) {
      if (!newCompletedExercises.includes(i)) {
        nextExerciseIndex = i;
        break;
      }
    }

    if (nextExerciseIndex === -1) {
      setCompletedExercises(newCompletedExercises);
      setShowCompletionModal(true);
    } else {
      setCompletedExercises(newCompletedExercises);
      setCurrentExerciseIndex(nextExerciseIndex);
      setCurrentSetIndex(0);
    }
  };

  const handleSelectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setCurrentSetIndex(0);
  };

  const handleAddExercise = (exercise: WorkoutExercise) => {
    const exerciseExists = exercisesState.some(
      (state) => state.exerciseData.exerciseId === exercise.exerciseId,
    );

    if (exerciseExists) {
      Alert.alert(
        t.duplicateExercise,
        `"${exercise.exerciseName}" ${t.alreadyAdded}`,
      );
      return;
    }

    const newState = [...exercisesState];
    newState.push({
      exerciseData: exercise,
      completedSetIndices: [],
      completedSets: [],
      restTimeSeconds: exercise.plannedRestSeconds || 90,
    });
    setExercisesState(newState);
  };

  const handleDeleteExercise = () => {
    Alert.alert(t.deleteExercise, t.deleteExerciseConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        onPress: () => {
          const newState = exercisesState.filter(
            (_, index) => index !== currentExerciseIndex,
          );

          if (newState.length === 0) {
            Alert.alert(t.lastExerciseTitle, t.cannotDeleteLastExercise);
            return;
          }

          const newCompletedExercises = completedExercises
            .filter((index) => index !== currentExerciseIndex)
            .map((index) => (index > currentExerciseIndex ? index - 1 : index));

          setExercisesState(newState);
          setCompletedExercises(newCompletedExercises);

          let newCurrentIndex = currentExerciseIndex;
          if (currentExerciseIndex >= newState.length) {
            newCurrentIndex = newState.length - 1;
          }

          setCurrentExerciseIndex(newCurrentIndex);
          setCurrentSetIndex(0);
        },
        style: "destructive",
      },
    ]);
  };

  const handleSkipRest = () => {
    if (setTimeoutRef.current) {
      clearTimeout(setTimeoutRef.current);
    }

    setShowRestScreen(false);

    executeSetTransition(isLastSet, isLastExercise, exercisesState);
  };

  const handleEndWorkout = () => {
    Alert.alert(t.finishWorkout, t.finishWorkoutConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.finish,
        onPress: () => setShowCompletionModal(true),
        style: "destructive",
      },
    ]);
  };

  // Ferme tout le groupe (workout) (choix de séance + séance en direct) et revient
  // sur l'onglet stats sans rien laisser dans la pile.
  const leaveWorkout = () => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate("/(tabs)/stats");
  };

  const handleMinimize = async () => {
    await persistSession();
    router.replace("/(tabs)/explore");
  };

  const handleDiscardWorkout = () => {
    Alert.alert(t.dontSave, t.dontSaveConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.dontSave,
        style: "destructive",
        onPress: async () => {
          await clearActiveSession();
          setShowCompletionModal(false);
          router.replace("/(tabs)/explore");
        },
      },
    ]);
  };

  const handleSubmitCompletion = async () => {
    if (!completionTitle.trim()) {
      Alert.alert(t.error, t.pleaseEnterTitle);
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await TokenService.get();

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

      const saved = await createCompletedWorkout(request, token || undefined);

      // La séance est déjà enregistrée : un échec d'envoi de photo ne doit pas la faire perdre.
      let photoError: string | null = null;
      if (completionPhoto) {
        try {
          await PhotoService.uploadWorkoutPhoto(saved.id, completionPhoto);
        } catch (err) {
          photoError = err instanceof Error ? err.message : t.cannotUploadPhoto;
        }
      }
      await clearActiveSession();

      const goToStats = leaveWorkout;
      const records = saved.badges ?? [];
      setShowCompletionModal(false);
      if (records.length > 0) {
        photoFailedRef.current = !!photoError;
        setNewBadges(records);
      } else {
        Alert.alert(
          t.success,
          photoError ? `${t.workoutSavedSuccess}\n${t.photoNotSent}` : t.workoutSavedSuccess,
          [{ text: "OK", onPress: goToStats }],
        );
      }
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert(t.error, t.cannotSaveWorkout);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1">
        <ScreenBackground flat />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1">
      <ScreenBackground flat />
      <StatusBar barStyle="light-content" />

      <WorkoutSessionHeader
        workoutTitle={workoutName}
        totalTime={totalWorkoutTime}
        onMinimize={handleMinimize}
        onEndWorkout={handleEndWorkout}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
      >
        {currentExercise && (
          <>
            {showRestScreen ? (
              <View className="mx-5 my-3 gap-6 rounded-hero bg-surface p-5">
                <View className="items-center">
                  <Text className="mb-1 text-sm text-ink-muted">
                    {t.restTime}
                  </Text>
                  <Text className="text-center text-2xl font-semibold text-ink">
                    {currentExercise?.exerciseName || t.currentExercise}
                  </Text>
                </View>

                <View className="items-center rounded-card bg-accent-tint px-3 py-6">
                  <Text
                    className="text-center text-[72px] font-semibold text-ink"
                    style={{ fontVariant: ["tabular-nums"], lineHeight: 80 }}
                  >
                    {restTimeRemaining}
                  </Text>
                  <Text className="mt-1 text-sm text-accent-text">
                    {t.seconds}
                  </Text>
                </View>

                <View className="h-1.5 overflow-hidden rounded-full bg-raised">
                  <View
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${restTimeTotal > 0 ? (restTimeRemaining / restTimeTotal) * 100 : 0}%`,
                    }}
                  />
                </View>

                <Button
                  icon="play-forward"
                  label={t.skipRest}
                  onPress={handleSkipRest}
                />
              </View>
            ) : (
              <CurrentExerciseSection
                exerciseName={currentExercise.exerciseName || t.currentExercise}
                currentSetIndex={currentSetIndex}
                totalSets={currentExercise.sets.length}
                plannedSetData={currentExercise.sets}
                completedSets={currentExerciseState.completedSets}
                onCompleteSet={handleCompleteSet}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
                onSkipExercise={handleSkipExercise}
                onDeleteExercise={handleDeleteExercise}
                isLastExercise={isLastExercise}
                isLastSet={isLastSet}
                lastStats={currentExerciseId ? exerciseStats[currentExerciseId] : null}
              />
            )}

            <OtherExercisesSection
              exercises={exercisesState.map((s) => s.exerciseData)}
              currentExerciseIndex={currentExerciseIndex}
              onSelectExercise={handleSelectExercise}
              onAddExercise={handleAddExercise}
              completedExercises={completedExercises}
            />
          </>
        )}

        <View className="h-8" />
      </ScrollView>

      <Modal
        visible={showCompletionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <GestureHandlerRootView className="flex-1 justify-end bg-overlay">
          <Animated.View style={[{ maxHeight: "90%" }, sheetStyle]}>
            <View className="rounded-t-hero bg-surface px-5 pb-8 pt-3">
              <GestureDetector gesture={sheetPan}>
                <View collapsable={false}>
                  <View className="mb-5 h-6 w-full items-center justify-start">
                    <View className="h-1.5 w-12 rounded-full bg-raised" />
                  </View>

                  <View className="mb-6 items-center">
                    <View className="h-20 w-20 items-center justify-center rounded-full bg-success-tint">
                      <Ionicons
                        name="checkmark"
                        size={40}
                        color={WorkoutTheme.status.success}
                      />
                    </View>
                    <Text className="mt-4 text-2xl font-semibold text-ink">
                      {t.workoutCompleted}
                    </Text>
                  </View>
                </View>
              </GestureDetector>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-5"
              >
                <FormField label={t.titleLabel}>
                  <TextField
                    placeholder={t.workoutNameLabel}
                    value={completionTitle}
                    onChangeText={setCompletionTitle}
                    editable={!isSubmitting}
                  />
                </FormField>

                <FormField label={t.descriptionOptional}>
                  <TextField
                    multiline
                    placeholder={t.addDescriptionPlaceholder}
                    value={completionDescription}
                    onChangeText={setCompletionDescription}
                    editable={!isSubmitting}
                  />
                </FormField>

                <WorkoutImagePicker
                  image={completionPhoto}
                  onImageChange={setCompletionPhoto}
                />

                <View className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1">
                      <Button
                        icon="checkmark"
                        label={t.save}
                        loading={isSubmitting}
                        onPress={handleSubmitCompletion}
                      />
                    </View>
                    <PressableScale
                      onPress={isSubmitting ? undefined : handleDiscardWorkout}
                      accessibilityRole="button"
                      accessibilityLabel={t.dontSave}
                      className={`h-[52px] w-[52px] items-center justify-center rounded-full bg-danger-tint ${isSubmitting ? "opacity-50" : ""}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={WorkoutTheme.status.danger}
                      />
                    </PressableScale>
                  </View>
                  <Button
                    variant="secondary"
                    label={t.back}
                    disabled={isSubmitting}
                    onPress={() => setShowCompletionModal(false)}
                  />
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </GestureHandlerRootView>
      </Modal>
      <NewRecordsSheet
        badges={newBadges}
        visible={newBadges.length > 0}
        onClose={() => {
          setNewBadges([]);
          if (photoFailedRef.current) Alert.alert(t.error, t.photoNotSent);
          leaveWorkout();
        }}
      />
    </SafeAreaView>
  );
}
