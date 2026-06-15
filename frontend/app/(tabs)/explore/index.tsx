import React from "react";
import { StatusBar, Text, View } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function ExploreScreen() {
  return (
    <View
      style={{
        backgroundColor: WorkoutTheme.background,
        flex: 1,
      }}
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 flex flex-col items-center justify-center pb-40 gap-1">
        <Ionicons
          name="globe-outline"
          size={64}
          color={WorkoutTheme.accent.purple}
        />
        <Text className="text-2xl font-bold text-white text-center">
          Page à venir
        </Text>
        <Text className="text-lg text-gray-400 text-center">
          Cette fonctionnalité sera bientôt disponible
        </Text>
      </View>
    </View>
  );
}
