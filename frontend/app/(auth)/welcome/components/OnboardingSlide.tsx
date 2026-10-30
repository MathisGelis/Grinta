import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";

import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
const { width, height } = Dimensions.get("window");

export default function OnboardingSlide({ item }: { item: any }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.container, { width }]}>
      <Image source={item.image} className="w-full h-full absolute" resizeMode="cover" />
      <View className="absolute bottom-0 left-0 right-0 h-[50%] bg-scrim" />
      <View className="absolute bottom-9 left-6 right-6">
        <Text className="text-[22px] text-ink opacity-[0.9] mb-1">{t[item.title as keyof typeof t] as string}</Text>
        <Text className="text-2xl text-ink font-bold">{t[item.subtitle as keyof typeof t] as string}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height * 0.75,
    backgroundColor: WorkoutTheme.background,
    overflow: "hidden",
  },
});
