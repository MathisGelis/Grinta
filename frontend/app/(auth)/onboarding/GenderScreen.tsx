import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
const CIRCLE = 140;

export default function GenderScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<"male" | "female" | null>(null);

  const handleNext = () => {
    if (!selected) return;
    router.push({
      pathname: "/(auth)/onboarding/AgeScreen",
      params: { gender: selected },
    });
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink text-center mb-3">{t.tellAboutYourself}</Text>
      <Text className="text-[15px] text-ink-muted text-center leading-[22px] mb-[60px]">
        {t.genderIntro}
      </Text>

      <View className="items-center gap-6 flex-1 justify-center -mt-10">
        <PressableScale
          style={[styles.circle, selected === "male" && styles.circleActive]}
          onPress={() => setSelected("male")}
        >
          <MaterialCommunityIcons
            name="gender-male"
            size={56}
            color={selected === "male" ? WorkoutTheme.text.primary : WorkoutTheme.text.tertiary}
          />
          <Text
            className={`text-[15px] mt-1 ${selected === "male" ? "text-ink" : "text-ink-muted"}`}
          >
            {t.male}
          </Text>
        </PressableScale>

        <PressableScale
          style={[styles.circle, selected === "female" && styles.circleActive]}
          onPress={() => setSelected("female")}
        >
          <MaterialCommunityIcons
            name="gender-female"
            size={56}
            color={selected === "female" ? WorkoutTheme.text.primary : WorkoutTheme.text.tertiary}
          />
          <Text
            className={`text-[15px] mt-1 ${selected === "female" ? "text-ink" : "text-ink-muted"}`}
          >
            {t.female}
          </Text>
        </PressableScale>
      </View>

      <View className="flex-row items-center pb-12 pt-4">
        <View className="flex-1" />
        <PressableScale
          className={`bg-accent py-4 px-10 rounded-full ${!selected ? "opacity-[0.4]" : ""}`}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text className="text-ink text-base font-bold">{t.nextBtn}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: WorkoutTheme.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  circleActive: {
    backgroundColor: WorkoutTheme.accent.purple,
  },
});
