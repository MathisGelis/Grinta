import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
}

export default function ActiveWorkoutScreen() {
  const params = useLocalSearchParams();
  const workoutName = params.workoutName as string;

  // Mock exercises data - should come from backend
  const mockExercises: Exercise[] = [
    {
      id: "e1",
      name: "Bench Press",
      sets: 4,
      reps: 8,
      weight: 100,
    },
    {
      id: "e2",
      name: "Pull-ups",
      sets: 4,
      reps: 10,
    },
    {
      id: "e3",
      name: "Rows",
      sets: 3,
      reps: 12,
      weight: 80,
    },
  ];

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showRestScreen, setShowRestScreen] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>(
    new Array(mockExercises.length).fill(false),
  );

  const currentExercise = mockExercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === mockExercises.length - 1;
  const isLastSet = currentSet === (currentExercise.sets || 1);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const finishSet = () => {
    const updatedCompleted = [...completedExercises];
    updatedCompleted[currentExerciseIndex] = true;
    setCompletedExercises(updatedCompleted);

    if (isLastSet) {
      if (isLastExercise) {
        router.push({
          pathname: "/(workout)/workout-summary",
          params: {
            workoutName,
            totalTime: timer,
          },
        });
      } else {
        setShowRestScreen(true);
        setIsRunning(false);
        setTimeout(() => {
          setShowRestScreen(false);
          setCurrentExerciseIndex(currentExerciseIndex + 1);
          setCurrentSet(1);
          setTimer(0);
        }, 5000);
      }
    } else {
      setCurrentSet(currentSet + 1);
      setShowRestScreen(true);
      setIsRunning(false);
      setTimeout(() => {
        setShowRestScreen(false);
      }, 5000);
    }
  };

  const skipExercise = () => {
    if (isLastExercise) {
      router.push({
        pathname: "/(workout)/workout-summary",
        params: {
          workoutName,
          totalTime: timer,
        },
      });
    } else {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      const updatedCompleted = [...completedExercises];
      updatedCompleted[currentExerciseIndex] = true;
      setCompletedExercises(updatedCompleted);
    }
  };

  const endWorkout = () => {
    router.push({
      pathname: "/(workout)/workout-summary",
      params: {
        workoutName,
        totalTime: timer,
      },
    });
  };

  if (showRestScreen) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-950 justify-center items-center px-4">
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <Ionicons name="checkmark-circle" size={80} color="#7B61FF" />
        <Text className="text-white text-2xl font-bold mt-6">Great Work!</Text>
        <Text className="text-neutral-400 text-base mt-2">
          Rest for a moment
        </Text>
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          Next:{" "}
          {isLastSet && !isLastExercise
            ? mockExercises[currentExerciseIndex + 1]?.name
            : `Set ${currentSet + 1}`}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-950">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header with progress */}
      <View className="bg-neutral-900 border-b border-neutral-800 px-4 py-3">
        <View className="flex-row justify-between items-center mb-3">
          <TouchableOpacity onPress={() => endWorkout()}>
            <Ionicons name="chevron-down" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">{workoutName}</Text>
          <View className="w-7" />
        </View>

        {/* Progress bar */}
        <View className="bg-neutral-800 rounded-full h-2">
          <View
            className="bg-purple-600 rounded-full h-2"
            style={{
              width: `${((currentExerciseIndex + 1) / mockExercises.length) * 100}%`,
              backgroundColor: "#7B61FF",
            }}
          />
        </View>
        <Text className="text-xs text-neutral-400 mt-2">
          {currentExerciseIndex + 1} of {mockExercises.length} exercises
        </Text>
      </View>

      {/* Main content */}
      <ScrollView
        className="flex-1 px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise Card */}
        <View className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 mb-6">
          {/* Large exercise number background */}
          <View className="bg-purple-600/10 p-6 border-b border-neutral-800">
            <Text className="text-4xl font-black text-white/10 text-center mb-2">
              {currentExerciseIndex + 1}
            </Text>
            <Text className="text-2xl font-bold text-white text-center">
              {currentExercise.name}
            </Text>
          </View>

          {/* Exercise details */}
          <View className="p-6">
            <View className="flex-row justify-around mb-6">
              {currentExercise.weight && (
                <View className="items-center">
                  <Ionicons name="barbell" size={24} color="#7B61FF" />
                  <Text className="text-sm text-neutral-400 mt-1">Weight</Text>
                  <Text className="text-xl font-bold text-white">
                    {currentExercise.weight}
                    <Text className="text-sm">kg</Text>
                  </Text>
                </View>
              )}
              <View className="items-center">
                <Ionicons name="repeat" size={24} color="#7B61FF" />
                <Text className="text-sm text-neutral-400 mt-1">Reps</Text>
                <Text className="text-xl font-bold text-white">
                  {currentExercise.reps}
                </Text>
              </View>
              <View className="items-center">
                <Ionicons name="layers" size={24} color="#7B61FF" />
                <Text className="text-sm text-neutral-400 mt-1">Sets</Text>
                <Text className="text-xl font-bold text-white">
                  {currentSet}/{currentExercise.sets}
                </Text>
              </View>
            </View>

            {/* Timer section */}
            <View className="bg-neutral-800 rounded-xl p-6 items-center mb-4">
              <Text className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Time
              </Text>
              <Text className="text-5xl font-bold text-white font-mono">
                {formatTime(timer)}
              </Text>
            </View>

            {/* Timer controls */}
            <View className="flex-row gap-2 justify-center mb-4">
              <TouchableOpacity
                onPress={toggleTimer}
                className={`flex-1 rounded-lg py-3 flex-row items-center justify-center gap-2 ${
                  isRunning ? "bg-red-600" : "bg-green-600"
                }`}
              >
                <Ionicons
                  name={isRunning ? "pause" : "play"}
                  size={20}
                  color="white"
                />
                <Text className="text-white font-semibold">
                  {isRunning ? "PAUSE" : "START"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTimer(0)}
                className="bg-neutral-800 rounded-lg py-3 px-6 items-center justify-center"
              >
                <Ionicons name="refresh" size={20} color="#7B61FF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Exercise list */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Exercises
          </Text>
          <View className="bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
            {mockExercises.map((exercise, index) => (
              <View
                key={exercise.id}
                className={`px-4 py-3 flex-row items-center justify-between ${
                  index !== mockExercises.length - 1
                    ? "border-b border-neutral-800"
                    : ""
                } ${index === currentExerciseIndex ? "bg-purple-600/10" : ""}`}
              >
                <View className="flex-1">
                  <Text
                    className={`font-semibold ${
                      index === currentExerciseIndex
                        ? "text-white"
                        : "text-neutral-300"
                    }`}
                  >
                    {exercise.name}
                  </Text>
                  <Text className="text-xs text-neutral-500 mt-1">
                    {exercise.sets}×{exercise.reps}
                    {exercise.weight && ` @ ${exercise.weight}kg`}
                  </Text>
                </View>
                {completedExercises[index] ? (
                  <Ionicons name="checkmark-circle" size={24} color="#7B61FF" />
                ) : index === currentExerciseIndex ? (
                  <View
                    className="w-6 h-6 rounded-full border-2 border-purple-600"
                    style={{ borderColor: "#7B61FF" }}
                  />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#525252" />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="bg-neutral-900 border-t border-neutral-800 px-4 py-4 gap-2">
        <TouchableOpacity
          onPress={finishSet}
          className="rounded-lg py-4 items-center justify-center"
          style={{
            backgroundColor: "#7B61FF",
          }}
        >
          <Text className="text-white font-bold text-lg">
            {isLastSet && isLastExercise
              ? "Finish Workout"
              : isLastSet
                ? "Next Exercise"
                : "Finish Set"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={skipExercise}
          className="bg-neutral-800 rounded-lg py-3 items-center justify-center"
        >
          <Text className="text-white font-semibold">
            {isLastExercise ? "Finish Workout" : "Skip Exercise"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
