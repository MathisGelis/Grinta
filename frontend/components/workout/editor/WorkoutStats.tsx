import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { ExerciseSetupData } from "@/components/workout/exercises/ExerciseSetupItem";

import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutStatsProps {
  exercises: ExerciseSetupData[];
  estimatedTime: string;
}

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <View className="flex-1 gap-3 rounded-tile bg-surface p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
        <Ionicons name={icon} size={18} color={WorkoutTheme.accent.purple} />
      </View>
      <View>
        <Text
          className="text-xl font-semibold text-ink"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {value}
        </Text>
        <Text className="mt-0.5 text-xs text-ink-muted">{label}</Text>
      </View>
    </View>
  );
}

export default function WorkoutStats({
  exercises,
  estimatedTime,
}: WorkoutStatsProps) {
  const { t } = useTranslation();
  const totalWeight = exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  }, 0);

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <View className="gap-4">
      <Text className="text-xl font-semibold text-ink">
        {t.estimatedStats}
      </Text>
      <View className="flex-row gap-3">
        <StatItem
          icon="barbell"
          value={`${totalWeight.toFixed(0)}kg`}
          label={t.totalWeight}
        />
        <StatItem icon="repeat" value={String(totalSets)} label={t.sets} />
        <StatItem icon="timer" value={`${estimatedTime}m`} label={t.duration} />
      </View>
    </View>
  );
}
