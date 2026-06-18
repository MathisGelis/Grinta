import React, { useState, useEffect, useCallback } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import {
  getPlannedWorkouts,
  getWorkoutById,
  PlannedWorkout,
  fullPlannedWorkout,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";

export default function CurrentWorkoutScreen() {
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] =
    useState<fullPlannedWorkout | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
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
        Alert.alert("Erreur", "Impossible de charger les détails de la séance");
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
      Alert.alert("Erreur", "Impossible de charger les séances");
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

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: WorkoutTheme.backgroundSecondary }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: WorkoutTheme.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: WorkoutTheme.text.primary,
            }}
          >
            Sélectionner une séance
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: WorkoutTheme.text.secondary,
              marginTop: 2,
            }}
          >
            Choisissez une séance pour commencer
          </Text>
        </View>
        <TouchableOpacity onPress={closeScreen} style={{ padding: 8 }}>
          <Ionicons name="close" size={24} color={WorkoutTheme.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {workouts.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 60,
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
              Aucune séance créée
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: WorkoutTheme.text.tertiary,
                marginTop: 8,
                textAlign: "center",
                paddingHorizontal: 32,
              }}
            >
              Créez une séance dans l&apos;onglet Workouts pour commencer
            </Text>
          </View>
        ) : (
          <>
            {/* Section 1: Selected Workout Details */}
            {selectedWorkout && (
              <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: WorkoutTheme.text.secondary,
                    textTransform: "uppercase",
                    marginBottom: 12,
                    letterSpacing: 0.5,
                  }}
                >
                  Séance sélectionnée
                </Text>

                <View
                  style={{
                    backgroundColor: WorkoutTheme.backgroundTertiary,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: WorkoutTheme.border,
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <View
                    style={{
                      backgroundColor: WorkoutTheme.accent.purple,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: "white",
                      }}
                    >
                      {selectedWorkout.title}
                    </Text>
                    {selectedWorkout.description && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: "rgba(255,255,255,0.7)",
                          marginTop: 6,
                        }}
                      >
                        {selectedWorkout.description}
                      </Text>
                    )}
                  </View>

                  {/* Exercises List */}
                  <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: WorkoutTheme.text.secondary,
                        textTransform: "uppercase",
                        marginBottom: 12,
                        letterSpacing: 0.5,
                      }}
                    >
                      Exercices ({selectedWorkout.exercises.length})
                    </Text>

                    <View style={{ gap: 12 }}>
                      {loadingDetail ? (
                        <View
                          style={{
                            justifyContent: "center",
                            alignItems: "center",
                            paddingVertical: 20,
                          }}
                        >
                          <ActivityIndicator
                            size="small"
                            color={WorkoutTheme.accent.purple}
                          />
                        </View>
                      ) : (
                        selectedWorkout.exercises.map((exercise, index) => (
                          <View
                            key={exercise.exerciseId}
                            style={{
                              backgroundColor: WorkoutTheme.background,
                              borderRadius: 8,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: WorkoutTheme.border,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <Ionicons
                                name="barbell"
                                size={16}
                                color={WorkoutTheme.accent.purple}
                              />
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "600",
                                  color: WorkoutTheme.text.primary,
                                  marginLeft: 8,
                                  flex: 1,
                                }}
                              >
                                {exercise.exerciseName}
                              </Text>
                              <View
                                style={{
                                  backgroundColor: WorkoutTheme.accent.purple,
                                  borderRadius: 6,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "700",
                                    color: "white",
                                  }}
                                >
                                  {exercise.sets.length} séries
                                </Text>
                              </View>
                            </View>

                            {/* Sets Details */}
                            <View style={{ gap: 8 }}>
                              {exercise.sets.map((set, setIndex) => (
                                <View
                                  key={setIndex}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 8,
                                    paddingVertical: 6,
                                    backgroundColor:
                                      WorkoutTheme.backgroundSecondary,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: "600",
                                      color: WorkoutTheme.text.secondary,
                                      minWidth: 40,
                                    }}
                                  >
                                    Série {setIndex + 1}
                                  </Text>
                                  <View
                                    style={{
                                      flex: 1,
                                      flexDirection: "row",
                                      gap: 12,
                                      marginLeft: 12,
                                    }}
                                  >
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <Ionicons
                                        name="fitness"
                                        size={12}
                                        color={WorkoutTheme.accent.purple}
                                      />
                                      <Text
                                        style={{
                                          fontSize: 11,
                                          fontWeight: "600",
                                          color: WorkoutTheme.text.primary,
                                        }}
                                      >
                                        {set.reps} reps
                                      </Text>
                                    </View>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <Ionicons
                                        name="barbell"
                                        size={12}
                                        color={WorkoutTheme.status.success}
                                      />
                                      <Text
                                        style={{
                                          fontSize: 11,
                                          fontWeight: "600",
                                          color: WorkoutTheme.text.primary,
                                        }}
                                      >
                                        {set.weight} kg
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>

                            {/* Rest Time */}
                            {exercise.plannedRestSeconds && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 8,
                                  paddingHorizontal: 8,
                                  paddingVertical: 6,
                                  backgroundColor:
                                    WorkoutTheme.backgroundSecondary,
                                  borderRadius: 6,
                                }}
                              >
                                <Ionicons
                                  name="timer"
                                  size={12}
                                  color={WorkoutTheme.status.info}
                                />
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "600",
                                    color: WorkoutTheme.text.secondary,
                                    marginLeft: 6,
                                  }}
                                >
                                  Repos: {exercise.plannedRestSeconds}s
                                </Text>
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                  {/* Start Button */}
                  <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                    <TouchableOpacity
                      onPress={startWorkout}
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
                      <Ionicons name="play" size={18} color="white" />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "white",
                        }}
                      >
                        Commencer la séance
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Separator */}
            {workouts.length > 1 && (
              <View
                style={{
                  height: 1,
                  backgroundColor: WorkoutTheme.border,
                  marginVertical: 8,
                  marginHorizontal: 16,
                }}
              />
            )}

            {/* Section 2: Workouts List with Search */}
            {workouts.length > 1 && (
              <View style={{ paddingHorizontal: 16 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: WorkoutTheme.text.secondary,
                    textTransform: "uppercase",
                    marginBottom: 12,
                    letterSpacing: 0.5,
                  }}
                >
                  Autres séances
                </Text>

                {/* Search Bar */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: WorkoutTheme.backgroundTertiary,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: WorkoutTheme.border,
                  }}
                >
                  <Ionicons
                    name="search"
                    size={18}
                    color={WorkoutTheme.text.secondary}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      fontSize: 14,
                      color: WorkoutTheme.text.primary,
                    }}
                    placeholder="Rechercher une séance..."
                    placeholderTextColor={WorkoutTheme.text.tertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={WorkoutTheme.text.secondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Workouts List */}
                <View style={{ gap: 10, marginBottom: 16 }}>
                  {filteredWorkouts.length > 0 ? (
                    filteredWorkouts.map((workout) => (
                      <TouchableOpacity
                        key={workout.id}
                        onPress={() => handleSelectWorkout(workout.id)}
                        style={{
                          backgroundColor:
                            selectedWorkoutId === workout.id
                              ? WorkoutTheme.accent.purple + "20"
                              : WorkoutTheme.backgroundTertiary,
                          borderRadius: 10,
                          padding: 12,
                          borderWidth: 2,
                          borderColor:
                            selectedWorkoutId === workout.id
                              ? WorkoutTheme.accent.purple
                              : WorkoutTheme.border,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: WorkoutTheme.text.primary,
                            }}
                          >
                            {workout.title}
                          </Text>
                          {workout.description && (
                            <Text
                              style={{
                                fontSize: 12,
                                color: WorkoutTheme.text.secondary,
                                marginTop: 4,
                              }}
                              numberOfLines={1}
                            >
                              {workout.description}
                            </Text>
                          )}
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            gap: 8,
                            alignItems: "center",
                            marginLeft: 12,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: WorkoutTheme.backgroundSecondary,
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="barbell"
                              size={12}
                              color={WorkoutTheme.accent.purple}
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "600",
                                color: WorkoutTheme.text.secondary,
                              }}
                            >
                              {workout.totalExercises}
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              selectedWorkoutId === workout.id
                                ? "checkmark-circle"
                                : "chevron-forward"
                            }
                            size={20}
                            color={
                              selectedWorkoutId === workout.id
                                ? WorkoutTheme.accent.purple
                                : WorkoutTheme.text.secondary
                            }
                          />
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View
                      style={{
                        alignItems: "center",
                        paddingVertical: 24,
                      }}
                    >
                      <Ionicons
                        name="search"
                        size={40}
                        color={WorkoutTheme.text.tertiary}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: WorkoutTheme.text.secondary,
                          marginTop: 12,
                        }}
                      >
                        Aucune séance trouvée
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
