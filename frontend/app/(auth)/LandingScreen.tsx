import { router } from "expo-router";
import React from "react";
import { View, Text } from "react-native";
import ScreenBackground from "@/components/ui/ScreenBackground";
import Button from "@/components/ui/Button";

import { useTranslation } from "@/contexts/LanguageContext";
export default function LandingScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center px-6">
      <ScreenBackground />

      <Text
        className="mb-3 text-[56px] font-semibold italic text-ink"
        style={{ letterSpacing: -1 }}
      >
        Grinta
      </Text>
      <Text className="mb-16 text-center text-base text-ink-muted">
        {t.appTagline}
      </Text>

      <View className="w-full gap-3">
        <Button label={t.login} onPress={() => router.push("/(auth)/LoginScreen")} />
        <Button
          variant="secondary"
          label={t.createAccount}
          onPress={() => router.push("/(auth)/RegisterScreen")}
        />
      </View>
    </View>
  );
}
