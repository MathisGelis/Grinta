import React, { useState } from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DrumRollPicker } from "@/components/DrumRollPicker";
import type { Gender, Goal } from "@/services/user.service";
import { mergeOnboardingDraft } from "@/utils/onboardingDraft";

import ScreenBackground from "@/components/ui/ScreenBackground";
import OnboardingNav from "@/components/ui/OnboardingNav";
import { useTranslation } from "@/contexts/LanguageContext";
const GOALS = [
  { id: "gain_weight", label: "goalGainWeight" },
  { id: "lose_weight", label: "goalLoseWeight" },
  { id: "get_fitter", label: "goalGetFitter" },
  { id: "flexibility", label: "goalFlexibility" },
  { id: "learn_basics", label: "goalLearnBasics" },
] as const satisfies readonly { id: Goal; label: string }[];

export default function GoalScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    gender: string;
    age: string;
    weight: string;
    height: string;
  }>();
  const [goalIndex, setGoalIndex] = useState(2);

  const handleFinish = (withGoal = true) => {
    const age = parseInt(params.age);
    const height = parseInt(params.height);
    const weight = parseInt(params.weight);
    mergeOnboardingDraft({
      ...(Number.isNaN(age) ? {} : { birthDate: `${new Date().getFullYear() - age}-01-01` }),
      ...(Number.isNaN(height) ? {} : { height }),
      ...(Number.isNaN(weight) ? {} : { weight }),
      ...(params.gender ? { gender: params.gender as Gender } : {}),
      ...(withGoal ? { goal: GOALS[goalIndex].id } : {}),
    });
    router.push("/(auth)/onboarding/TrainingScreen" as any);
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink mb-3">{t.whatsYourGoal}</Text>
      <Text className="text-[15px] text-ink-muted mb-10">{t.personalizedPlanHint}</Text>

      <View className="flex-1 justify-center">
        <DrumRollPicker
          items={GOALS.map((g) => t[g.label])}
          selectedIndex={goalIndex}
          onSelect={setGoalIndex}
          fontSize={28}
        />
      </View>

      <OnboardingNav
        onNext={() => handleFinish()}
        nextLabel={t.nextBtn}
        onSkip={() => handleFinish(false)}
        skipLabel={t.skipBtn}
      />
    </View>
  );
}
