import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
}

interface Workout {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  exercises: Exercise[];
  estimatedDuration?: number;
  calories?: number;
}

export default function CurrentWorkoutScreen() {
  const [workouts] = useState<Workout[]>([
    {
      id: "1",
      name: "Upper Body",
      image_url:
        "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?cs=srgb&dl=pexels-victorfreitas-841130.jpg&fm=jpg",
      description: "Full upper body workout",
      exercises: [
        { id: "e1", name: "Bench Press", sets: 4, reps: 8, weight: 100 },
        { id: "e2", name: "Pull-ups", sets: 4, reps: 10 },
        { id: "e3", name: "Rows", sets: 3, reps: 12, weight: 80 },
      ],
      estimatedDuration: 90,
      calories: 530,
    },
    {
      id: "2",
      name: "Lower Body",
      image_url:
        "https://images.pexels.com/photos/392988/pexels-photo-392988.jpeg?cs=srgb&dl=pexels-victorfreitas-392988.jpg&fm=jpg",
      description: "Leg strength training",
      exercises: [
        { id: "e4", name: "Squats", sets: 4, reps: 8, weight: 120 },
        { id: "e5", name: "Deadlifts", sets: 3, reps: 5, weight: 140 },
        { id: "e6", name: "Leg Press", sets: 3, reps: 10, weight: 180 },
      ],
      estimatedDuration: 75,
      calories: 600,
    },
  ]);

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    workouts.length > 0 ? workouts[0].id : null,
  );
  const [loading, setLoading] = useState(false);

  const selectedWorkout = workouts.find((w) => w.id === selectedWorkoutId);

  const startWorkout = (workout: Workout) => {
    setLoading(true);
    setTimeout(() => {
      router.push({
        pathname: "/(workout)/active-workout",
        params: {
          workoutId: workout.id,
          workoutName: workout.name,
          exerciseCount: workout.exercises.length,
        },
      });
      setLoading(false);
    }, 300);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 justify-center items-center">
        <ActivityIndicator size="large" color="#7B61FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-950">
      {/* Header */}
      <View className="px-4 py-4 border-b border-neutral-800">
        <Text className="text-2xl font-bold text-white">Start Workout</Text>
        <Text className="text-neutral-400 text-sm mt-1">
          Choose and begin your session
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {workouts.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="barbell-outline" size={64} color="#4B5563" />
            <Text className="text-lg text-neutral-300 mt-4 text-center">
              No workouts created yet
            </Text>
            <Text className="text-sm text-neutral-500 mt-2 text-center">
              Create a workout in the Workouts tab to get started
            </Text>
          </View>
        ) : (
          <View className="px-4 py-6 gap-6">
            {/* Selected Workout Preview */}
            {selectedWorkout && (
              <View>
                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  Selected Workout
                </Text>
                <View className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl overflow-hidden">
                  <ImageBackground
                    source={
                      selectedWorkout.image_url
                        ? { uri: selectedWorkout.image_url }
                        : require("@/assets/onboarding1.jpg")
                    }
                    className="h-56 w-full justify-between"
                    imageStyle={{ opacity: 0.5 }}
                  >
                    <View className="bg-black/40 flex-1 justify-between p-4">
                      {/* Title */}
                      <View>
                        <Text className="text-3xl font-bold text-white">
                          {selectedWorkout.name}
                        </Text>
                        {selectedWorkout.description && (
                          <Text className="text-white/70 text-sm mt-2">
                            {selectedWorkout.description}
                          </Text>
                        )}
                      </View>

                      {/* Stats with purple accent */}
                      <View className="flex-row gap-2">
                        <View className="bg-red-500/80 rounded-full px-3 py-1.5 flex-row items-center gap-1">
                          <Ionicons name="flame" size={14} color="white" />
                          <Text className="text-white text-xs font-semibold">
                            {selectedWorkout.calories || 0} kcal
                          </Text>
                        </View>
                        <View className="bg-blue-500/80 rounded-full px-3 py-1.5 flex-row items-center gap-1">
                          <Ionicons name="time" size={14} color="white" />
                          <Text className="text-white text-xs font-semibold">
                            {selectedWorkout.estimatedDuration || 0}min
                          </Text>
                        </View>
                        <View className="bg-purple-400/80 rounded-full px-3 py-1.5 flex-row items-center gap-1">
                          <Ionicons name="barbell" size={14} color="white" />
                          <Text className="text-white text-xs font-semibold">
                            {selectedWorkout.exercises.length} ex
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ImageBackground>

                  {/* Exercises Preview */}
                  <View className="bg-neutral-900/50 p-4 border-t border-neutral-700">
                    <Text className="text-xs font-semibold text-neutral-400 uppercase mb-3">
                      Exercises ({selectedWorkout.exercises.length})
                    </Text>
                    <View className="gap-2">
                      {selectedWorkout.exercises.slice(0, 3).map((exercise) => (
                        <View
                          key={exercise.id}
                          className="flex-row items-center"
                        >
                          <View className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2" />
                          <Text className="text-sm text-neutral-200 flex-1">
                            {exercise.name}
                          </Text>
                          {(exercise.sets ||
                            exercise.reps ||
                            exercise.weight) && (
                            <Text className="text-xs text-neutral-400">
                              {exercise.weight && `${exercise.weight}kg `}
                              {exercise.sets &&
                                `${exercise.sets}×${exercise.reps}`}
                            </Text>
                          )}
                        </View>
                      ))}
                      {selectedWorkout.exercises.length > 3 && (
                        <Text className="text-xs text-neutral-500 mt-2">
                          +{selectedWorkout.exercises.length - 3} more exercises
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Start Button */}
                <TouchableOpacity
                  onPress={() => startWorkout(selectedWorkout)}
                  className="bg-purple-600 rounded-lg py-4 flex-row items-center justify-center gap-2 mt-4 shadow-lg"
                  style={{
                    backgroundColor: "#7B61FF",
                  }}
                >
                  <Ionicons name="play" size={20} color="white" />
                  <Text className="text-white font-bold text-base">
                    Start Workout
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Separator */}
            {workouts.length > 1 && (
              <View className="border-t border-neutral-800 pt-6">
                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  Other Workouts
                </Text>
              </View>
            )}

            {/* Other Workouts List */}
            {workouts.length > 1 && (
              <View className="gap-3 pb-6">
                {workouts.map((workout) => {
                  if (workout.id === selectedWorkoutId) return null;
                  return (
                    <TouchableOpacity
                      key={workout.id}
                      onPress={() => setSelectedWorkoutId(workout.id)}
                      className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 active:border-purple-500"
                      activeOpacity={0.7}
                    >
                      <ImageBackground
                        source={
                          workout.image_url
                            ? { uri: workout.image_url }
                            : require("@/assets/onboarding1.jpg")
                        }
                        className="h-32 w-full justify-between"
                        imageStyle={{ opacity: 0.4 }}
                      >
                        <View className="bg-black/40 flex-1 justify-between p-3">
                          <View>
                            <Text className="text-lg font-bold text-white">
                              {workout.name}
                            </Text>
                          </View>
                          <View className="flex-row gap-2">
                            <View className="bg-neutral-700 rounded-full px-2 py-1 flex-row items-center gap-1">
                              <Ionicons name="time" size={12} color="white" />
                              <Text className="text-white text-xs font-semibold">
                                {workout.estimatedDuration}min
                              </Text>
                            </View>
                            <View className="bg-neutral-700 rounded-full px-2 py-1 flex-row items-center gap-1">
                              <Ionicons
                                name="barbell"
                                size={12}
                                color="white"
                              />
                              <Text className="text-white text-xs font-semibold">
                                {workout.exercises.length} ex
                              </Text>
                            </View>
                          </View>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
