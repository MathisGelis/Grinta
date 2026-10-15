import React, { useState } from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DrumRollPicker } from "@/components/DrumRollPicker";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
const MIN_AGE = 10;
const MAX_AGE = 80;
const ages = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);
const DEFAULT_AGE = 25;

export default function AgeScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ gender: string }>();
  const [ageIndex, setAgeIndex] = useState(DEFAULT_AGE - MIN_AGE);

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/WeightScreen",
      params: { gender: params.gender, age: String(ages[ageIndex]) },
    });
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink mb-3">{t.howOldAreYou}</Text>
      <Text className="text-[15px] text-ink-muted mb-10">{t.personalizedPlanHint}</Text>

      <View className="flex-1 justify-center">
        <DrumRollPicker
          items={ages}
          selectedIndex={ageIndex}
          onSelect={setAgeIndex}
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
