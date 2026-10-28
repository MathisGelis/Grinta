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
import { TokenService } from "@/services/token.service";
import Modal from "@/components/ui/AppModal";
import { useTranslation } from "@/contexts/LanguageContext";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import IconButton from "@/components/ui/IconButton";
import MuscleMap from "@/components/ui/MuscleMap";
import { usePlannedMuscleData } from "@/hooks/usePlannedMuscleData";
import Button from "@/components/ui/Button";
const SECONDS_PER_SET = 45;

function formatRest(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return rest ? `${mins}min${rest}` : `${mins}min`;
}

export default function CurrentWorkoutScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] =
    useState<fullPlannedWorkout | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const muscleData = usePlannedMuscleData(selectedWorkout?.exercises);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
      const plannedWorkouts = await getPlannedWorkouts(token || undefined);
      setWorkouts(plannedWorkouts);

      if (plannedWorkouts.length > 0) {
        setSelectedWorkoutId(plannedWorkouts[0].id);
        loadWorkoutDetail(plannedWorkouts[0].id, token || undefined);
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
      <ScreenBackground />
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
      <ScreenBackground />
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-1">
        {workouts.length > 0 ? (
          <Pressable
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t.selectWorkout}
            className="flex-1 flex-row items-center gap-3 rounded-tile bg-surface px-4 py-3 active:opacity-70"
          >
            <View className="flex-1">
              <Text className="text-xs text-ink-muted">{t.selectWorkout}</Text>
              <Text
                numberOfLines={1}
                className="mt-0.5 text-lg font-semibold text-ink"
              >
                {selectedWorkout?.title ?? "–"}
              </Text>
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
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          >
            {selectedWorkout && (
              <>
                {selectedWorkout.description ? (
                  <Text
                    className="text-sm text-ink-soft"
                  >
                    {selectedWorkout.description}
                  </Text>
                ) : null}

                {summary && (
                  <View
                    className="flex-row mt-4 mb-5 rounded-full bg-raised border border-line py-3"
                  >
                    {[
                      { value: `${summary.exercises}`, label: t.exercises },
                      { value: `${summary.sets}`, label: t.sets },
                      {
                        value:
                          summary.volume >= 1000
                            ? `${(summary.volume / 1000).toFixed(1)}t`
                            : `${summary.volume}kg`,
                        label: t.volumeLabel,
                      },
                      { value: `~${summary.minutes}min`, label: t.duration },
                    ].map((stat, index) => (
                      <View
                        key={stat.label}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          borderLeftWidth: index === 0 ? 0 : 1,
                          borderLeftColor: WorkoutTheme.border,
                        }}
                      >
                        <Text
                          className="text-[17px] font-bold text-ink"
                        >
                          {stat.value}
                        </Text>
                        <Text
                          className="text-[10px] mt-0.5 tracking-[0.4px] uppercase text-ink-muted"
                        >
                          {stat.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {muscleData.length > 0 && (
                  <View className="mb-5 gap-3 rounded-card bg-surface p-4">
                    <Text className="text-base font-semibold text-ink">
                      {t.musclesWorkedTitle}
                    </Text>
                    <MuscleMap data={muscleData} unit={t.sets.toLowerCase()} />
                  </View>
                )}

                {loadingDetail ? (
                  <ActivityIndicator
                    size="small"
                    color={WorkoutTheme.accent.purple}
                    style={{ marginTop: 24 }}
                  />
                ) : (
                  <View className="gap-2.5">
                    {selectedWorkout.exercises.map((exercise, index) => (
                      <View
                        key={exercise.exerciseId}
                        className="bg-raised rounded-tile border border-line p-3.5"
                      >
                        <View
                          className="flex-row items-center gap-2.5"
                        >
                          <Text
                            className="text-xs font-bold text-ink-muted w-[18px]"
                          >
                            {index + 1}
                          </Text>
                          <Text
                            numberOfLines={1}
                            className="flex-1 text-[15px] font-semibold text-ink"
                          >
                            {exercise.exerciseName}
                          </Text>
                          {exercise.plannedRestSeconds ? (
                            <View
                              className="flex-row items-center gap-1"
                            >
                              <Ionicons
                                name="time-outline"
                                size={13}
                                color={WorkoutTheme.text.tertiary}
                              />
                              <Text
                                className="text-xs font-semibold text-ink-muted"
                              >
                                {formatRest(exercise.plannedRestSeconds)}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View
                          className="flex-row flex-wrap gap-1.5 mt-2.5 ml-7"
                        >
                          {exercise.sets.map((set, setIndex) => (
                            <View
                              key={setIndex}
                              className="px-[9px] py-[5px] rounded-[7px] bg-background"
                            >
                              <Text
                                className="text-xs font-semibold text-ink"
                              >
                                {set.weight > 0
                                  ? `${set.reps} × ${set.weight}`
                                  : `${set.reps} ${t.repsUnit}`}
                                {set.weight > 0 ? (
                                  <Text
                                    className="text-ink-muted"
                                  >
                                    {" "}
                                    kg
                                  </Text>
                                ) : null}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

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
