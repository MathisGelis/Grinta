import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
export default function ChatScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      
      className="flex-1"
    >
      <ScreenBackground />
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b border-b-surface"
        
      >
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={WorkoutTheme.text.primary} />
        </PressableScale>

        <Text className="text-lg font-semibold text-ink">{t.messagesTitle}</Text>

        <View className="w-7" />
      </View>

      <View className="flex-1 items-center justify-center pb-40">
        <Ionicons
          name="paper-plane-outline"
          size={64}
          color={WorkoutTheme.accent.purple}
        />

        <Text className="mt-4 text-2xl font-bold text-ink">{t.comingSoonTitle}</Text>

        <Text
          className="mt-2 text-sm text-center text-ink-soft"
          
        >
          {t.comingSoonText}
        </Text>
      </View>
    </SafeAreaView>
  );
}
