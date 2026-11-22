import React, { useState } from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import RulerPicker from "@/components/ui/RulerPicker";

import OnboardingNav from "@/components/ui/OnboardingNav";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useTranslation } from "@/contexts/LanguageContext";
// Bornes acceptées par le serveur : 20 à 400 kg.
const MIN_WEIGHT = 20;
const MAX_WEIGHT = 250;
const DEFAULT_WEIGHT = 70;

export default function WeightScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ gender: string; age: string }>();
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/HeightScreen",
      params: {
        gender: params.gender,
        age: params.age,
        weight: String(weight),
      },
    });
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink mb-3">{t.whatsYourWeight}</Text>
      <Text className="text-[15px] text-ink-muted mb-10">{t.changeLaterHint}</Text>

      <View className="flex-1 justify-center">
        <Text
          numberOfLines={1}
          className="mb-14 text-center font-bold text-ink"
          style={{ fontSize: 56, fontVariant: ["tabular-nums"] }}
        >
          {weight}
          <Text className="text-xl font-normal text-ink-muted"> kg</Text>
        </Text>
        <RulerPicker
          value={weight}
          onChange={setWeight}
          min={MIN_WEIGHT}
          max={MAX_WEIGHT}
          majorEvery={10}
          mediumEvery={5}
        />
      </View>

      <OnboardingNav
        onNext={handleNext}
        nextLabel={t.nextBtn}
        onSkip={() => router.push({ pathname: "/(auth)/onboarding/HeightScreen", params: { gender: params.gender, age: params.age } })}
        skipLabel={t.skipBtn}
      />
    </View>
  );
}
