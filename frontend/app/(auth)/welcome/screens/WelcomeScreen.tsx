import React from "react";
import { View, Text } from "react-native";
import { saveItem } from "@/core/services/storage";
import { router } from "expo-router";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const handleStart = () => {
    saveItem("hasSeenWelcome", "true");
    router.push("/(auth)/LandingScreen");
  };

  return (
    <View className="flex-1 justify-center items-center p-5">
      <ScreenBackground />
      <Text className="text-[28px] text-ink font-bold mb-2.5">{t.welcomeToGrinta}</Text>
      <Text className="text-base text-ink-soft mb-[30px]">{t.letsGetStarted}</Text>
      <PressableScale className="bg-accent p-3.5 rounded-[10px]" onPress={handleStart}>
        <Text className="text-ink text-base font-bold">{t.continueBtn}</Text>
      </PressableScale>
    </View>
  );
}
