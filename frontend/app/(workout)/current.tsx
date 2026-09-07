import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
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

/** Rough work time per set, used only for the "~x min" estimate. */
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
    [],
  );

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const token = await TokenService.get();
      const plannedWorkouts = await getPlannedWorkouts(token || undefined);
      setWorkouts(plannedWorkouts);

      // Select first workout by default
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
  }, [loadWorkoutDetail]);

  // Load all workouts
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

  // Filter workouts based on search query
  const filteredWorkouts = workouts.filter((workout) =>
    workout.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // What you actually want to know before starting: how much work is ahead.
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
        style={{ flex: 1, backgroundColor: WorkoutTheme.backgroundSecondary }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: WorkoutTheme.backgroundSecondary }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: WorkoutTheme.text.primary,
            letterSpacing: -0.3,
          }}
        >
          {t.selectWorkout}
        </Text>
        <TouchableOpacity
          onPress={closeScreen}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: WorkoutTheme.backgroundTertiary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={18} color={WorkoutTheme.text.primary} />
        </TouchableOpacity>
      </View>

      {workouts.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <Ionicons
            name="barbell-outline"
            size={64}
            color={WorkoutTheme.text.tertiary}
          />
          <Text
            style={{
              fontSize: 16,
              color: WorkoutTheme.text.secondary,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {t.noWorkoutCreated}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: WorkoutTheme.text.tertiary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {t.createWorkoutHint}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          >
            {selectedWorkout && (
              <>
                <TouchableOpacity
                  onPress={() => setPickerVisible(true)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: 26,
                      fontWeight: "700",
                      color: WorkoutTheme.text.primary,
                      letterSpacing: -0.5,
                    }}
                  >
                    {selectedWorkout.title}
                  </Text>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: WorkoutTheme.backgroundTertiary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={17}
                      color={WorkoutTheme.text.secondary}
                    />
                  </View>
                </TouchableOpacity>
                {selectedWorkout.description ? (
                  <Text
                    style={{
                      fontSize: 14,
                      color: WorkoutTheme.text.secondary,
                      marginTop: 4,
                    }}
                  >
                    {selectedWorkout.description}
                  </Text>
                ) : null}

                {/* Summary strip */}
                {summary && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 16,
                      marginBottom: 20,
                      borderRadius: 14,
                      backgroundColor: WorkoutTheme.backgroundTertiary,
                      borderWidth: 1,
                      borderColor: WorkoutTheme.border,
                      paddingVertical: 12,
                    }}
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
                          style={{
                            fontSize: 17,
                            fontWeight: "700",
                            color: WorkoutTheme.text.primary,
                          }}
                        >
                          {stat.value}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            marginTop: 2,
                            letterSpacing: 0.4,
                            textTransform: "uppercase",
                            color: WorkoutTheme.text.tertiary,
                          }}
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
                  <View style={{ gap: 10 }}>
                    {selectedWorkout.exercises.map((exercise, index) => (
                      <View
                        key={exercise.exerciseId}
                        style={{
                          backgroundColor: WorkoutTheme.backgroundTertiary,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: WorkoutTheme.border,
                          padding: 14,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: WorkoutTheme.text.tertiary,
                              width: 18,
                            }}
                          >
                            {index + 1}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              fontSize: 15,
                              fontWeight: "600",
                              color: WorkoutTheme.text.primary,
                            }}
                          >
                            {exercise.exerciseName}
                          </Text>
                          {exercise.plannedRestSeconds ? (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Ionicons
                                name="time-outline"
                                size={13}
                                color={WorkoutTheme.text.tertiary}
                              />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: WorkoutTheme.text.tertiary,
                                }}
                              >
                                {formatRest(exercise.plannedRestSeconds)}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Sets as inline chips: one line instead of one row each */}
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 10,
                            marginLeft: 28,
                          }}
                        >
                          {exercise.sets.map((set, setIndex) => (
                            <View
                              key={setIndex}
                              style={{
                                paddingHorizontal: 9,
                                paddingVertical: 5,
                                borderRadius: 7,
                                backgroundColor: WorkoutTheme.background,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: WorkoutTheme.text.primary,
                                }}
                              >
                                {set.weight > 0
                                  ? `${set.reps} × ${set.weight}`
                                  : `${set.reps} reps`}
                                {set.weight > 0 ? (
                                  <Text
                                    style={{ color: WorkoutTheme.text.tertiary }}
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

          {/* Picker as a sheet: a horizontal pill row stops working once
              there are more than a handful of workouts. */}
          <Modal
            isVisible={pickerVisible}
            onBackdropPress={() => setPickerVisible(false)}
            onSwipeComplete={() => setPickerVisible(false)}
            swipeDirection="down"
            propagateSwipe
            useNativeDriverForBackdrop
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
                style={{
                  height: 4,
                  width: 44,
                  borderRadius: 2,
                  alignSelf: "center",
                  backgroundColor: WorkoutTheme.border,
                  marginBottom: 14,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: WorkoutTheme.backgroundTertiary,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  marginHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="search"
                  size={16}
                  color={WorkoutTheme.text.tertiary}
                />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    paddingHorizontal: 8,
                    fontSize: 14,
                    color: WorkoutTheme.text.primary,
                  }}
                  placeholder={t.searchWorkout}
                  placeholderTextColor={WorkoutTheme.text.tertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={WorkoutTheme.text.tertiary}
                    />
                  </TouchableOpacity>
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
                    <TouchableOpacity
                      key={workout.id}
                      activeOpacity={0.8}
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
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: WorkoutTheme.text.primary,
                          }}
                        >
                          {workout.title}
                        </Text>
                        {workout.description ? (
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 12,
                              marginTop: 3,
                              color: WorkoutTheme.text.tertiary,
                            }}
                          >
                            {workout.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          marginRight: 10,
                          color: WorkoutTheme.text.tertiary,
                        }}
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
                    </TouchableOpacity>
                  );
                })}

                {filteredWorkouts.length === 0 && (
                  <Text
                    style={{
                      fontSize: 14,
                      textAlign: "center",
                      paddingVertical: 28,
                      color: WorkoutTheme.text.tertiary,
                    }}
                  >
                    {t.noWorkoutFound}
                  </Text>
                )}
              </ScrollView>
            </View>
          </Modal>

          {/* Pinned: the primary action should never require scrolling */}
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
            <TouchableOpacity
              onPress={startWorkout}
              disabled={!selectedWorkout || loadingDetail}
              activeOpacity={0.85}
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
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
