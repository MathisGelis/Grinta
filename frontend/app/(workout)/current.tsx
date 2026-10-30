import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator, TextInput, Alert, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import {
  getPlannedWorkouts,
  getWorkoutById,
  PlannedWorkout,
  fullPlannedWorkout,
} from "@/services/workouts.service";
import { getTodayProgramme, type ProgrammeToday } from "@/services/programms.service";
import { getWorkoutSuggestion, type WorkoutSuggestion } from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";
import { localDate } from "@/utils/date";
import { format } from "@/i18n/translations";
import Modal from "@/components/ui/AppModal";
import { useTranslation } from "@/contexts/LanguageContext";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import IconButton from "@/components/ui/IconButton";
import Button from "@/components/ui/Button";
import MuscleMap from "@/components/ui/MuscleMap";
import { usePlannedMuscleData } from "@/hooks/usePlannedMuscleData";
import { getExercisesById, type Exercise } from "@/services/exercises.service";
const SECONDS_PER_SET = 45;

export default function CurrentWorkoutScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] =
    useState<fullPlannedWorkout | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const muscleData = usePlannedMuscleData(selectedWorkout?.exercises);
  const [areaHeight, setAreaHeight] = useState(0);
  const [listContentHeight, setListContentHeight] = useState(0);
  const [exercisesById, setExercisesById] = useState<Map<string, Exercise>>(new Map());
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getExercisesById()
      .then((map) => !cancelled && setExercisesById(map))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [muscleData]);

  // Changer de séance remet la carte en vue d'ensemble.
  useEffect(() => setFocusedExerciseId(null), [selectedWorkoutId]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [today, setToday] = useState<ProgrammeToday | null>(null);
  const [suggestion, setSuggestion] = useState<WorkoutSuggestion | null>(null);

  const loadWorkoutDetail = useCallback(
    async (workoutId: string, token?: string) => {
      try {
        setLoadingDetail(true);
        const detail = await getWorkoutById(workoutId, token || undefined);
        setSelectedWorkout(detail);
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
        Alert.alert(t.error, t.cannotLoadWorkoutDetails);
      } finally {
        setLoadingDetail(false);
      }
    },
    [t],
  );

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const token = await TokenService.get();
      const date = localDate();
      const [plannedWorkouts, programme, suggested] = await Promise.all([
        getPlannedWorkouts(token || undefined),
        getTodayProgramme(date).catch(() => null),
        getWorkoutSuggestion(date).catch(() => null),
      ]);
      setWorkouts(plannedWorkouts);
      setToday(programme);
      setSuggestion(suggested);

      // Programme en cours : la séance du jour est proposée par défaut.
      // Sinon rien n'est présélectionné, l'écran le dit clairement.
      const planned = programme?.status === "workout" ? programme.workout : null;
      if (planned) {
        setSelectedWorkoutId(planned.id);
        loadWorkoutDetail(planned.id, token || undefined);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des workouts:", error);
      Alert.alert(t.error, t.cannotLoadWorkouts);
    } finally {
      setLoading(false);
    }
  }, [t, loadWorkoutDetail]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleSelectWorkout = async (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    const token = await TokenService.get();
    loadWorkoutDetail(workoutId, token || undefined);
  };

  const startWorkout = () => {
    if (!selectedWorkout) return;
    router.push({
      pathname: "/(workout)/active-workout",
      params: {
        workoutId: selectedWorkout.id,
        workoutName: selectedWorkout.title,
        exerciseCount: selectedWorkout.exercises.length,
      },
    });
  };

  const closeScreen = () => {
    router.back();
  };

  const fromProgramme =
    today?.status === "workout" && !!today.workout && selectedWorkoutId === today.workout.id;

  // La carte fait la hauteur de la liste (au plus la zone disponible au-dessus du bouton), comme avant.
  // Avec l'en-tête (titre + icône, 36 px + écart de 8) et le padding de la carte (24) en plus. La silhouette (200 × 400 à l'échelle 1) reste sous 44 % de la largeur.
  const maxBodyScale = Math.max(0.3, (windowWidth * 0.44 - 24) / 200);
  const bodyScale = Math.min(
    maxBodyScale,
    Math.max(0.3, (Math.min(listContentHeight || 300, areaHeight || Infinity) - 24 - 44) / 400),
  );

  const focusedExercise = focusedExerciseId ? exercisesById.get(focusedExerciseId) : undefined;

  const suggestedId = suggestion?.suggestion?.workout.id;
  const suggestedChosen = !!suggestedId && selectedWorkoutId === suggestedId;
  const firstMuscle = suggestion?.suggestion?.muscles[0];
  const suggestedWhy = firstMuscle
    ? format(t.sgMuscleLine, {
        muscle: t.muscleNames[firstMuscle.muscle] ?? firstMuscle.muscle.replace(/_/g, " "),
        n: Math.round(firstMuscle.workedSets * 10) / 10,
      })
    : "";

  const filteredWorkouts = workouts.filter((workout) =>
    workout.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const summary = useMemo(() => {
    if (!selectedWorkout) return null;
    let sets = 0;
    let volume = 0;
    let seconds = 0;

    for (const exercise of selectedWorkout.exercises) {
      sets += exercise.sets.length;
      for (const set of exercise.sets) volume += set.reps * set.weight;
      seconds +=
        exercise.sets.length *
        (SECONDS_PER_SET + (exercise.plannedRestSeconds || 90));
    }
    return {
      exercises: selectedWorkout.exercises.length,
      sets,
      volume,
      minutes: Math.max(1, Math.round(seconds / 60)),
    };
  }, [selectedWorkout]);

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1"
      >
      <ScreenBackground flat />
        <View
          className="flex-1 justify-center items-center"
        >
          <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1"
    >
      <ScreenBackground flat />
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-1">
        {workouts.length > 0 ? (
          <Pressable
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t.selectWorkout}
            className="flex-1 flex-row items-center gap-3 rounded-tile bg-surface px-4 py-3 active:opacity-70"
          >
            <View className="flex-1">
              <Text className="text-xs text-ink-muted">
                {fromProgramme && today
                  ? format(t.cmFromProgramme, { n: today.dayNumber ?? 1, total: today.cycleLength })
                  : t.selectWorkout}
              </Text>
              <Text
                numberOfLines={1}
                className={`mt-0.5 text-lg font-semibold ${selectedWorkout ? "text-ink" : "text-ink-muted"}`}
              >
                {selectedWorkout?.title ?? t.cmNone}
              </Text>
              {!selectedWorkoutId && today?.status === "rest" ? (
                <Text className="mt-0.5 text-xs text-accent-text">{t.cmNoneRest}</Text>
              ) : null}
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-raised">
              <Ionicons
                name="swap-horizontal"
                size={18}
                color={WorkoutTheme.text.primary}
              />
            </View>
          </Pressable>
        ) : (
          <Text className="flex-1 text-[22px] font-bold tracking-[-0.3px] text-ink">
            {t.selectWorkout}
          </Text>
        )}
        <IconButton icon="close" label={t.closeLabel} onPress={closeScreen} />
      </View>

      {workouts.length === 0 ? (
        <View
          className="flex-1 justify-center items-center px-8"
        >
          <Ionicons
            name="barbell-outline"
            size={64}
            color={WorkoutTheme.text.tertiary}
          />
          <Text
            className="text-base text-ink-soft mt-4 text-center"
          >
            {t.noWorkoutCreated}
          </Text>
          <Text
            className="text-sm text-ink-muted mt-2 text-center"
          >
            {t.createWorkoutHint}
          </Text>
        </View>
      ) : (
        <>
          <View className="flex-1 px-4 pb-3">
            {suggestion?.suggestion ? (
              <View className="mb-6 mt-5 flex-row items-center gap-3 rounded-tile bg-accent-tint p-3.5">
                <Ionicons name="sparkles" size={20} color={WorkoutTheme.accent.purple} />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                    {suggestion.suggestion.workout.title}
                  </Text>
                  <Text className="text-xs text-accent-text" numberOfLines={1}>
                    {suggestedWhy || t.sgTitle}
                  </Text>
                </View>
                <PressableScale
                  onPress={() => !suggestedChosen && handleSelectWorkout(suggestion.suggestion!.workout.id)}
                  accessibilityRole="button"
                  className={`h-10 flex-row items-center justify-center gap-1.5 rounded-full px-4 ${suggestedChosen ? "bg-raised" : "bg-accent"}`}
                >
                  {suggestedChosen ? (
                    <Ionicons name="checkmark" size={16} color={WorkoutTheme.text.primary} />
                  ) : null}
                  <Text className="text-sm font-semibold text-ink">
                    {suggestedChosen ? t.cmChosen : t.cmChoose}
                  </Text>
                </PressableScale>
              </View>
            ) : null}

            {selectedWorkout && summary ? (
              <Text className="mb-3 px-1 text-sm text-ink-muted">
                {format(t.exercisesCount, { n: summary.exercises })} ·{" "}
                {format(t.setsCount, { n: summary.sets })} · ~{summary.minutes} min
              </Text>
            ) : null}
            <View className="flex-1" onLayout={(e) => setAreaHeight(e.nativeEvent.layout.height)}>
              {loadingDetail ? (
                <ActivityIndicator
                  size="small"
                  color={WorkoutTheme.accent.purple}
                  style={{ marginTop: 24 }}
                />
              ) : selectedWorkout ? (
                <View className="flex-1 flex-row gap-3">
                {muscleData.length > 0 ? (
                  <View
                    className="justify-start self-start rounded-card bg-surface p-3"
                    style={{ width: Math.max(bodyScale * 200, 96) + 24 }}
                  >
                    <MuscleMap
                      data={muscleData}
                      scale={bodyScale}
                      compact
                      focus={
                        focusedExercise
                          ? {
                              primary: [focusedExercise.primary_muscle],
                              secondary: focusedExercise.secondary_muscles ?? [],
                            }
                          : null
                      }
                    />
                  </View>
                ) : null}
                  <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName="gap-2"
                    onContentSizeChange={(_, height) => setListContentHeight(height)}
                  >
                  {selectedWorkout.exercises.map((exercise) => {
                    const focused = focusedExerciseId === exercise.exerciseId;
                    return (
                      <PressableScale
                        key={exercise.exerciseId}
                        halo={false}
                        onPress={() =>
                          setFocusedExerciseId(focused ? null : exercise.exerciseId)
                        }
                        accessibilityRole="button"
                        accessibilityState={{ selected: focused }}
                        className={`rounded-tile px-3.5 py-3 ${focused ? "bg-accent-tint" : "bg-surface"}`}
                      >
                        <Text numberOfLines={2} className="text-sm font-semibold text-ink">
                          {exercise.exerciseName}
                        </Text>
                        <Text className="mt-0.5 text-xs font-medium text-ink-muted">
                          {format(t.setsCount, { n: exercise.sets.length })}
                        </Text>
                      </PressableScale>
                    );
                  })}
                  </ScrollView>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons name="barbell-outline" size={56} color={WorkoutTheme.text.disabled} />
                </View>
              )}
            </View>
          </View>

          <Modal
            isVisible={pickerVisible}
            onBackdropPress={() => setPickerVisible(false)}
            onSwipeComplete={() => setPickerVisible(false)}
            swipeDirection="down"
            style={{ justifyContent: "flex-end", margin: 0 }}
          >
            <View
              className="rounded-t-hero bg-surface px-5 pt-3"
              style={{
                maxHeight: windowHeight * 0.82,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-raised" />

              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-2xl font-semibold text-ink">
                  {t.searchWorkout}
                </Text>
                <IconButton
                  icon="close"
                  label={t.closeLabel}
                  onPress={() => setPickerVisible(false)}
                />
              </View>

              <View className="mb-4 h-12 flex-row items-center gap-2 rounded-full bg-raised px-4">
                <Ionicons
                  name="search"
                  size={18}
                  color={WorkoutTheme.text.tertiary}
                />
                <TextInput
                  className="flex-1 py-0 text-base text-ink"
                  placeholder={t.searchWorkout}
                  placeholderTextColor={WorkoutTheme.text.tertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <PressableScale onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={WorkoutTheme.text.tertiary}
                    />
                  </PressableScale>
                )}
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="gap-3 pb-2"
              >
                {filteredWorkouts.map((workout) => {
                  const active = selectedWorkoutId === workout.id;

                  return (
                    <PressableScale
                      key={workout.id}
                      onPress={() => {
                        setPickerVisible(false);
                        if (!active) handleSelectWorkout(workout.id);
                      }}
                      className={`flex-row items-center gap-3 rounded-tile p-4 ${active ? "bg-accent-tint" : "bg-raised"}`}
                    >
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-base font-semibold text-ink"
                        >
                          {workout.title}
                        </Text>
                        {workout.description ? (
                          <Text
                            numberOfLines={1}
                            className="mt-0.5 text-sm text-ink-muted"
                          >
                            {workout.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text className="text-xs text-ink-muted">
                        {workout.totalExercises} {t.exercisesShort}
                      </Text>
                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={WorkoutTheme.accent.purple}
                        />
                      )}
                    </PressableScale>
                  );
                })}

                {filteredWorkouts.length === 0 && (
                  <View className="items-center gap-2 rounded-card bg-raised p-8">
                    <Ionicons
                      name="barbell-outline"
                      size={28}
                      color={WorkoutTheme.text.tertiary}
                    />
                    <Text className="text-center text-sm text-ink-muted">
                      {t.noWorkoutFound}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Modal>

          <View
            className="px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <Button
              icon="play"
              label={t.startWorkout}
              disabled={!selectedWorkout}
              loading={loadingDetail}
              onPress={startWorkout}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
