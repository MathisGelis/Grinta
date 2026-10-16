import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator, TextInput, Alert } from "react-native";
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
import Modal from "react-native-modal";
import { useTranslation } from "@/contexts/LanguageContext";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
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
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] =
    useState<fullPlannedWorkout | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
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
      <View
        className="px-4 pt-1 pb-3 flex-row justify-between items-center"
      >
        <Text
          className="text-[22px] font-bold text-ink tracking-[-0.3px]"
        >
          {t.selectWorkout}
        </Text>
        <PressableScale
          onPress={closeScreen}
          hitSlop={8}
          className="w-8 h-8 rounded-full bg-raised items-center justify-center"
        >
          <Ionicons name="close" size={18} color={WorkoutTheme.text.primary} />
        </PressableScale>
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
                <PressableScale
                  onPress={() => setPickerVisible(true)}
                  className="flex-row items-center gap-2"
                >
                  <Text
                    numberOfLines={1}
                    className="flex-1 text-[26px] font-bold text-ink tracking-[-0.5px]"
                  >
                    {selectedWorkout.title}
                  </Text>
                  <View
                    className="w-[30px] h-[30px] rounded-full bg-raised items-center justify-center"
                  >
                    <Ionicons
                      name="chevron-down"
                      size={17}
                      color={WorkoutTheme.text.secondary}
                    />
                  </View>
                </PressableScale>
                {selectedWorkout.description ? (
                  <Text
                    className="text-sm text-ink-soft mt-1"
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
            propagateSwipe
            useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
            style={{ justifyContent: "flex-end", margin: 0 }}
          >
            <View
              style={{
                backgroundColor: WorkoutTheme.backgroundSecondary,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: "82%",
                paddingTop: 10,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              <View
                className="h-1 w-11 rounded-sm self-center bg-line mb-3.5"
              />

              <View
                className="flex-row items-center bg-raised rounded-[10px] px-3 mx-4 mb-3"
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={WorkoutTheme.text.tertiary}
                />
                <TextInput
                  className="flex-1 py-[11px] px-2 text-sm text-ink"
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
                      size={16}
                      color={WorkoutTheme.text.tertiary}
                    />
                  </PressableScale>
                )}
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
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
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 12,
                        padding: 14,
                        backgroundColor: active
                          ? WorkoutTheme.accent.purple + "22"
                          : WorkoutTheme.backgroundTertiary,
                        borderWidth: 1,
                        borderColor: active
                          ? WorkoutTheme.accent.purple
                          : WorkoutTheme.border,
                      }}
                    >
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="text-[15px] font-semibold text-ink"
                        >
                          {workout.title}
                        </Text>
                        {workout.description ? (
                          <Text
                            numberOfLines={1}
                            className="text-xs mt-[3px] text-ink-muted"
                          >
                            {workout.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        className="text-xs font-bold mr-2.5 text-ink-muted"
                      >
                        {workout.totalExercises} {t.exercisesShort}
                      </Text>
                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={WorkoutTheme.accent.purple}
                        />
                      )}
                    </PressableScale>
                  );
                })}

                {filteredWorkouts.length === 0 && (
                  <Text
                    className="text-sm text-center py-7 text-ink-muted"
                  >
                    {t.noWorkoutFound}
                  </Text>
                )}
              </ScrollView>
            </View>
          </Modal>

          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopWidth: 1,
              borderTopColor: WorkoutTheme.border,
              backgroundColor: WorkoutTheme.backgroundSecondary,
            }}
          >
            <PressableScale
              onPress={startWorkout}
              disabled={!selectedWorkout || loadingDetail}
              style={{
                backgroundColor: WorkoutTheme.accent.purple,
                opacity: !selectedWorkout || loadingDetail ? 0.5 : 1,
                borderRadius: 14,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="play" size={18} color="white" />
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "white" }}
              >
                {t.startWorkout}
              </Text>
            </PressableScale>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
