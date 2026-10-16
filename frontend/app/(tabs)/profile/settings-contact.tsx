import React from "react";
import { View, Text, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTranslation } from "@/contexts/LanguageContext";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
export default function SettingsContactScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1">
      <ScreenHeader title={t.contactUs} />

      <View className="mx-5 bg-surface rounded-card overflow-hidden">
        <PressableScale
          className="flex-row items-center px-5 py-[18px] gap-3.5"
          onPress={() => Linking.openURL("mailto:support@grinta.app")}
        >
          <View className="w-9 h-9 rounded-full bg-accent-tint items-center justify-center">
            <Ionicons name="mail-outline" size={20} color={WorkoutTheme.accent.purple} />
          </View>
          <View className="flex-1">
            <Text className="text-ink-muted text-xs mb-0.5">{t.email}</Text>
            <Text className="text-ink text-[15px] font-medium">support@grinta.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={WorkoutTheme.text.disabled} />
        </PressableScale>

        <View className="h-[1px] bg-raised mx-5" />

        <PressableScale
          className="flex-row items-center px-5 py-[18px] gap-3.5"
          onPress={() => Linking.openURL("https://instagram.com/grinta.app")}
        >
          <View className="w-9 h-9 rounded-full bg-accent-tint items-center justify-center">
            <Ionicons name="logo-instagram" size={20} color={WorkoutTheme.accent.purple} />
          </View>
          <View className="flex-1">
            <Text className="text-ink-muted text-xs mb-0.5">Instagram</Text>
            <Text className="text-ink text-[15px] font-medium">@grinta.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={WorkoutTheme.text.disabled} />
        </PressableScale>
      </View>
    </View>
  );
}
