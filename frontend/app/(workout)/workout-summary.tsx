import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams();
  const workoutName = params.workoutName as string;
  const totalTime = parseInt(params.totalTime as string) || 0;

  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min ${secs}s`;
  };

  // Mock stats
  const stats = {
    calories: 520,
    exercises: 3,
    sets: 11,
    reps: 91,
    volume: 2750, // kg
  };

  const goHome = () => {
    router.push("/(tabs)/explore");
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-950">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Celebration animation */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center justify-center py-12"
        >
          <View
            className="rounded-full p-6 mb-6"
            style={{
              backgroundColor: "#7B61FF",
            }}
          >
            <Ionicons name="checkmark" size={64} color="white" />
          </View>
          <Text className="text-3xl font-bold text-white text-center">
            Workout Complete!
          </Text>
          <Text className="text-base text-neutral-400 text-center mt-2">
            Great effort today
          </Text>
        </Animated.View>

        {/* Workout name and time */}
        <View className="px-4 mb-6">
          <View className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
            <Text className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Workout
            </Text>
            <Text className="text-2xl font-bold text-white mb-4">
              {workoutName}
            </Text>

            <View className="flex-row justify-between items-center pt-4 border-t border-neutral-800">
              <View>
                <Text className="text-xs text-neutral-400 uppercase font-semibold mb-1">
                  Total Time
                </Text>
                <Text className="text-2xl font-bold text-white">
                  {formatTime(totalTime)}
                </Text>
              </View>
              <Ionicons name="time" size={32} color="#7B61FF" />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-4 mb-6">
          <Text className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Summary
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {/* Calories */}
            <View className="flex-1 min-w-[47%] bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <View className="mb-3">
                <Ionicons name="flame" size={24} color="#ef4444" />
              </View>
              <Text className="text-xs text-neutral-400 uppercase font-semibold mb-1">
                Calories
              </Text>
              <Text className="text-2xl font-bold text-white">
                {stats.calories}
                <Text className="text-sm text-neutral-400"> kcal</Text>
              </Text>
            </View>

            {/* Exercises */}
            <View className="flex-1 min-w-[47%] bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <View className="mb-3">
                <Ionicons name="barbell" size={24} color="#3b82f6" />
              </View>
              <Text className="text-xs text-neutral-400 uppercase font-semibold mb-1">
                Exercises
              </Text>
              <Text className="text-2xl font-bold text-white">
                {stats.exercises}
              </Text>
            </View>

            {/* Sets */}
            <View className="flex-1 min-w-[47%] bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <View className="mb-3">
                <Ionicons name="layers" size={24} color="#7B61FF" />
              </View>
              <Text className="text-xs text-neutral-400 uppercase font-semibold mb-1">
                Sets
              </Text>
              <Text className="text-2xl font-bold text-white">
                {stats.sets}
              </Text>
            </View>

            {/* Reps */}
            <View className="flex-1 min-w-[47%] bg-neutral-900 rounded-xl p-4 border border-neutral-800">
              <View className="mb-3">
                <Ionicons name="repeat" size={24} color="#ec4899" />
              </View>
              <Text className="text-xs text-neutral-400 uppercase font-semibold mb-1">
                Total Reps
              </Text>
              <Text className="text-2xl font-bold text-white">
                {stats.reps}
              </Text>
            </View>
          </View>
        </View>

        {/* Volume */}
        <View className="px-4 mb-6">
          <View className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 flex-row items-center gap-4">
            <View
              className="rounded-full p-3"
              style={{ backgroundColor: "#7B61FF/20" }}
            >
              <Ionicons name="cube" size={24} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-neutral-400 uppercase font-semibold mb-1">
                Total Volume
              </Text>
              <Text className="text-xl font-bold text-white">
                {stats.volume.toLocaleString()}
                <Text className="text-sm text-neutral-400"> kg</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Achievement banner */}
        <View className="px-4 mb-8">
          <View
            className="rounded-xl p-4 flex-row items-center gap-3"
            style={{
              backgroundColor: "#7B61FF",
            }}
          >
            <Ionicons name="star" size={28} color="white" />
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">
                Great consistency!
              </Text>
              <Text className="text-white/80 text-xs">
                You&apos;ve completed 5 workouts this week
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View className="bg-neutral-900 border-t border-neutral-800 px-4 py-4 gap-2">
        <TouchableOpacity
          onPress={goHome}
          className="rounded-lg py-4 items-center justify-center flex-row gap-2"
          style={{
            backgroundColor: "#7B61FF",
          }}
        >
          <Ionicons name="home" size={20} color="white" />
          <Text className="text-white font-bold text-lg">Go Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goBack}
          className="bg-neutral-800 rounded-lg py-3 items-center justify-center"
        >
          <Text className="text-white font-semibold">Back to Workouts</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
