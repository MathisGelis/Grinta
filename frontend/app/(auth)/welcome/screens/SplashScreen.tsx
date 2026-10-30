import React, { useEffect, useMemo } from "react";
import { View, Animated } from "react-native";
import { router } from "expo-router";

import ScreenBackground from "@/components/ui/ScreenBackground";
export default function SplashScreen() {
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        router.replace("/(auth)/welcome/screens/OnboardingScreen");
      }, 1500);
    });
  }, [opacity]);

  return (
    <View className="flex-1 justify-center items-center">
      <ScreenBackground />
      <Animated.Text className="text-[42px] text-accent-light font-bold" style={{ opacity }}>Grinta</Animated.Text>
    </View>
  );
}
