import React, { useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DrumRollPicker } from "@/components/DrumRollPicker";
import { UserService, type Gender, type Goal } from "@/services/user.service";
import { getItem } from "@/core/services/storage";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
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

  const handleFinish = async () => {
    setLoading(true);
    try {
      const userId = await getItem("user_id");
      if (userId) {
        const birthYear = new Date().getFullYear() - parseInt(params.age);
        await UserService.updateProfile(userId, {
          birthDate: `${birthYear}-01-01`,
          height: parseInt(params.height),
          weight: parseInt(params.weight),
          gender: params.gender as Gender,
          goal: GOALS[goalIndex].id,
        });
      }
      router.replace("/(tabs)/explore");
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
        />
      </View>

      <View className="flex-row items-center justify-between pb-12 pt-4">
        <PressableScale className="w-[52px] h-[52px] rounded-[26px] bg-raised items-center justify-center" onPress={() => router.back()}>
          <Text className="text-ink text-xl">←</Text>
        </PressableScale>
        <PressableScale
          className="bg-accent py-4 px-10 rounded-full min-w-[130px] items-center"
          onPress={handleFinish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={WorkoutTheme.text.primary} />
          ) : (
            <Text className="text-ink text-base font-bold">{t.nextBtn}</Text>
          )}
        </PressableScale>
      </View>
    </View>
  );
}
