import React, { useState } from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import WallMeterPicker from "@/components/ui/WallMeterPicker";

import OnboardingNav from "@/components/ui/OnboardingNav";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { useTranslation } from "@/contexts/LanguageContext";
const MIN_HEIGHT = 0;
const MAX_HEIGHT = 250;
const DEFAULT_HEIGHT = 170;

export default function HeightScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    gender: string;
    age: string;
    weight: string;
  }>();
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/GoalScreen",
      params: {
        gender: params.gender,
        age: params.age,
        weight: params.weight,
        height: String(height),
      },
    });
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink mb-3">{t.whatsYourHeight}</Text>
      <Text className="text-[15px] text-ink-muted mb-10">{t.personalizedPlanHint}</Text>

      <View className="flex-1 flex-row items-center justify-center gap-6">
        {/* Largeur fixe + chiffres tabulaires: le changement de valeur ne décale rien. */}
        <View className="flex-1 flex-row items-baseline justify-end gap-2">
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            className="text-[56px] font-bold text-ink"
            style={{ fontVariant: ["tabular-nums"], width: 112, textAlign: "right" }}
          >
            {height}
          </Text>
          <Text className="text-xl text-ink-muted">cm</Text>
        </View>
        <WallMeterPicker
          value={height}
          onChange={setHeight}
          min={MIN_HEIGHT}
          max={MAX_HEIGHT}
          width={170}
        />
      </View>

      <OnboardingNav
        onNext={handleNext}
        nextLabel={t.nextBtn}
        onSkip={() => router.push({ pathname: "/(auth)/onboarding/GoalScreen", params: { gender: params.gender, age: params.age, weight: params.weight } })}
        skipLabel={t.skipBtn}
      />
    </View>
  );
}
