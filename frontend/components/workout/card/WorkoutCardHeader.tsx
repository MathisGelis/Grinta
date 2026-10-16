import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

import PressableScale from "@/components/ui/PressableScale";
import { format } from "@/i18n/translations";
import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutCardHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  totalExercises?: number;
  stats: {
    totalSets: number;
    totalWeight: number;
  };
  hasWorkout?: boolean;
}

function StatPill({
  icon,
  color,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}) {
  return (
    <View className="h-8 flex-row items-center gap-1.5 rounded-full bg-raised px-3">
      <Ionicons name={icon} size={14} color={color} />
      <Text className="text-xs font-medium text-ink">{label}</Text>
    </View>
  );
}

export default function WorkoutCardHeader({
  title,
  isExpanded,
  onToggleExpand,
  totalExercises,
  stats,
  hasWorkout,
}: WorkoutCardHeaderProps) {
  const { t } = useTranslation();
  return (
    <PressableScale
      onPress={onToggleExpand}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      accessibilityLabel={title}
      className="w-full gap-4 p-5"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className="flex-1 text-xl font-semibold text-ink"
          numberOfLines={2}
        >
          {title}
        </Text>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-raised">
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={WorkoutTheme.text.primary}
          />
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <StatPill
          icon="repeat"
          color={WorkoutTheme.accent.purple}
          label={format(t.setsCount, { n: stats.totalSets })}
        />
        {hasWorkout && (
          <StatPill
            icon="barbell"
            color={WorkoutTheme.status.success}
            label={`${stats.totalWeight} kg`}
          />
        )}
        {!!totalExercises && totalExercises > 0 && (
          <StatPill
            icon="fitness"
            color={WorkoutTheme.status.info}
            label={format(t.exercisesCount, { n: totalExercises })}
          />
        )}
      </View>
    </PressableScale>
  );
}
