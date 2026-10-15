import React, { useState } from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DrumRollPicker } from "@/components/DrumRollPicker";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
const MIN_HEIGHT = 140;
const MAX_HEIGHT = 220;
const heights = Array.from(
  { length: MAX_HEIGHT - MIN_HEIGHT + 1 },
  (_, i) => MIN_HEIGHT + i
);
const DEFAULT_HEIGHT = 170;

export default function HeightScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    gender: string;
    age: string;
    weight: string;
  }>();
  const [heightIndex, setHeightIndex] = useState(DEFAULT_HEIGHT - MIN_HEIGHT);

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/GoalScreen",
      params: {
        gender: params.gender,
        age: params.age,
        weight: params.weight,
        height: String(heights[heightIndex]),
      },
    });
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink mb-3">{t.whatsYourHeight}</Text>
      <Text className="text-[15px] text-ink-muted mb-10">{t.personalizedPlanHint}</Text>

      <View className="flex-1 justify-center">
        <DrumRollPicker
          items={heights}
          selectedIndex={heightIndex}
          onSelect={setHeightIndex}
          unit="cm"
        />
      </View>

      <View className="flex-row items-center justify-between pb-12 pt-4">
        <PressableScale className="w-[52px] h-[52px] rounded-[26px] bg-raised items-center justify-center" onPress={() => router.back()}>
          <Text className="text-ink text-xl">←</Text>
        </PressableScale>
        <PressableScale className="bg-accent py-4 px-10 rounded-full" onPress={handleNext}>
          <Text className="text-ink text-base font-bold">{t.nextBtn}</Text>
        </PressableScale>
      </View>
    </View>
  );
}
