import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ backgroundColor: WorkoutTheme.background }}
      className="flex-1"
    >
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{
          borderBottomColor: WorkoutTheme.backgroundSecondary,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-white">Notifications</Text>

        <View className="w-7" />
      </View>
      <View className="flex-1 flex flex-col items-center justify-center pb-40 gap-1">
        <Ionicons
          name="notifications-outline"
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
    </SafeAreaView>
  );
}
