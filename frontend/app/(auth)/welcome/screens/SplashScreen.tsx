import React, { useCallback } from "react";
import { View } from "react-native";
import { router } from "expo-router";

import ScreenBackground from "@/components/ui/ScreenBackground";
import LogoIntro from "@/components/ui/LogoIntro";

export default function SplashScreen() {
  const handleFinish = useCallback(() => {
    router.replace("/(auth)/welcome/screens/OnboardingScreen");
  }, []);

  return (
    <View className="flex-1 justify-center items-center">
      <ScreenBackground />
      <LogoIntro onFinish={handleFinish} />
    </View>
  );
}
