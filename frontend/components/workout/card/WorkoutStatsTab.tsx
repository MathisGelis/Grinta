import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { fullPlannedWorkout } from "@/services/workouts.service";

import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutStatsTabProps {
  workout: fullPlannedWorkout | null;
  stats: {
    totalSets: number;
    totalReps: number;
    totalWeight: number;
  };
}

export default function WorkoutStatsTab({
  workout,
  stats,
}: WorkoutStatsTabProps) {
  const { t } = useTranslation();
  return (
    <View className="pb-3 px-3 py-3">
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-1 min-w-[47%] bg-raised px-3 py-3.5 rounded-[10px] items-center border border-line">
          <Ionicons
            name="repeat"
            size={24}
            color={WorkoutTheme.accent.purple}
          />
          <Text className="text-base font-bold text-accent mt-1.5">
            {stats.totalSets}
          </Text>
          <Text className="text-[11px] text-ink-soft mt-1 text-center">
            {t.sets}
          </Text>
        </View>
        <View className="flex-1 min-w-[47%] bg-raised px-3 py-3.5 rounded-[10px] items-center border border-line">
          <Ionicons name="fitness" size={24} color={WorkoutTheme.status.info} />
          <Text className="text-base font-bold text-accent mt-1.5">
            {stats.totalReps}
          </Text>
          <Text className="text-[11px] text-ink-soft mt-1 text-center">
            {t.totalReps}
          </Text>
        </View>
        <View className="flex-1 min-w-[47%] bg-raised px-3 py-3.5 rounded-[10px] items-center border border-line">
          <Ionicons
            name="barbell"
            size={24}
            color={WorkoutTheme.status.success}
          />
          <Text className="text-base font-bold text-accent mt-1.5">
            {stats.totalWeight}
          </Text>
          <Text className="text-[11px] text-ink-soft mt-1 text-center">
            {t.totalKgLabel}
          </Text>
        </View>
        <View className="flex-1 min-w-[47%] bg-raised px-3 py-3.5 rounded-[10px] items-center border border-line">
          <Ionicons name="list" size={24} color={WorkoutTheme.status.danger} />
          <Text className="text-base font-bold text-accent mt-1.5">
            {workout?.exercises?.length || 0}
          </Text>
          <Text className="text-[11px] text-ink-soft mt-1 text-center">
            {t.exercises}
          </Text>
        </View>
      </View>
    </View>
  );
}
