import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

interface Exercise {
  id: string;
  name: string;
}

interface Workout {
  id: string;
  name: string;
  image_url?: string;
  exercises: Exercise[];
}

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([
    {
      id: "1",
      name: "Upper Body",
      image_url:
        "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?cs=srgb&dl=pexels-victorfreitas-841130.jpg&fm=jpg",
      exercises: [
        { id: "e1", name: "Bench Press" },
        { id: "e2", name: "Pull-ups" },
      ],
    },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const goToCreateWorkout = () => {
    router.push("/workouts/create");
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-100 pt-4">
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className="text-2xl font-bold text-black">Workouts</Text>
        <TouchableOpacity
          onPress={goToCreateWorkout}
          className="bg-black rounded-full p-3"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4">
        {workouts.map((workout) => (
          <View
            key={workout.id}
            className="bg-slate-100 rounded-lg -4 overflow-hidden relative"
          >
            <ImageBackground
              source={
                workout.image_url
                  ? { uri: workout.image_url }
                  : require("@/assets/onboarding1.jpg")
              }
              className="h-40 w-full"
            >
              <Text className="absolute text-xl font-bold text-white top-4 left-4">
                {workout.name}
              </Text>
              <View className="absolute w-full bg-transparent bottom-4 flex-row justify-between items-center px-4">
                <View className="flex-row gap-2">
                  <Text className="bg-red-400 text-white px-4 py-2 rounded-full text-xs font-bold">
                    530 kcal
                  </Text>
                  <Text className="bg-green-400 text-white px-4 py-2 rounded-full text-xs font-bold">
                    1h 30min
                  </Text>
                </View>

                <Ionicons
                  name={
                    expandedId === workout.id ? "chevron-up" : "chevron-down"
                  }
                  size={24}
                  color="white"
                  onPress={() => toggleExpand(workout.id)}
                />
              </View>
            </ImageBackground>

            {expandedId === workout.id && (
              <View className="bg-white border-t border-slate-300">
                {workout.exercises.length > 0 ? (
                  workout.exercises.map((exercise) => (
                    <View
                      key={exercise.id}
                      className="px-4 py-3 border-b border-slate-200 flex-row justify-between items-center"
                    >
                      <Text className="text-base text-black">
                        {exercise.name}
                      </Text>
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color="#999"
                      />
                    </View>
                  ))
                ) : (
                  <Text className="px-4 py-3 text-slate-400">
                    Aucun exercice
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
