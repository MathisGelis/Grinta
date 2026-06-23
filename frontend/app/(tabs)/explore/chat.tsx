import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";

export default function ChatScreen() {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ backgroundColor: WorkoutTheme.background }}
      className="flex-1"
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{
          borderBottomColor: WorkoutTheme.backgroundSecondary,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-white">Messages</Text>

        <View className="w-7" />
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center pb-40">
        <Ionicons
          name="paper-plane-outline"
          size={64}
          color={WorkoutTheme.accent.purple}
        />

        <Text className="mt-4 text-2xl font-bold text-white">Page à venir</Text>

        <Text
          className="mt-2 text-sm text-center"
          style={{ color: WorkoutTheme.text.secondary }}
        >
          Cette fonctionnalité sera bientôt disponible
        </Text>
      </View>
    </SafeAreaView>
  );
}
