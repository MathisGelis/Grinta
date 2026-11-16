import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DrumRollPicker } from "@/components/DrumRollPicker";
import { UserService, type Gender, type Goal } from "@/services/user.service";
import { getItem } from "@/core/services/storage";

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
  const [loading, setLoading] = useState(false);

  const handleFinish = async (withGoal = true) => {
    setLoading(true);
    try {
      const userId = await getItem("user_id");
      const age = parseInt(params.age);
      const height = parseInt(params.height);
      const weight = parseInt(params.weight);
      const data = {
        ...(Number.isNaN(age) ? {} : { birthDate: `${new Date().getFullYear() - age}-01-01` }),
        ...(Number.isNaN(height) ? {} : { height }),
        ...(Number.isNaN(weight) ? {} : { weight }),
        ...(params.gender ? { gender: params.gender as Gender } : {}),
        ...(withGoal ? { goal: GOALS[goalIndex].id } : {}),
      };
      if (userId && Object.keys(data).length > 0) {
        await UserService.updateProfile(userId, data);
      }
      router.replace("/(auth)/onboarding/TrainingScreen" as any);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
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
        loading={loading}
      />
    </View>
  );
}
