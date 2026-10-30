import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { router } from "expo-router";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
export default function NotificationsScreen() {
  const { t } = useTranslation();

  const swipeLeftToClose = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onEnd(() => router.back());

  return (
    <GestureDetector gesture={swipeLeftToClose}>
    <View className="flex-1">
      <ScreenBackground flat />
      <View className="flex-row items-center justify-between px-4 pt-16 pb-4">
        <PressableScale onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <Text className="text-ink text-lg font-bold">{t.notifications}</Text>
        <View className="w-10" />
      </View>

      <View className="items-center mt-20 gap-3">
        <Ionicons name="notifications-off-outline" size={48} color={WorkoutTheme.text.disabled} />
        <Text className="text-ink-faint text-base">{t.noNotifications}</Text>
      </View>
    </View>
    </GestureDetector>
  );
}
