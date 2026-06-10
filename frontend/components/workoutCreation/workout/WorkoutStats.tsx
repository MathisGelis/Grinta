import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { ExerciseSetupData } from "./ExerciseSetupItem";

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
    <View
      className="flex-1 rounded-xl px-3 py-3.5 items-center border gap-1.5"
      style={{
        backgroundColor: WorkoutTheme.backgroundSecondary,
        borderColor: WorkoutTheme.border,
      }}
    >
      <Ionicons name={icon} size={20} color={WorkoutTheme.accent.purple} />
      <Text className="text-base font-bold" style={{ color: WorkoutTheme.accent.purple }}>
        {value}
      </Text>
      <Text className="text-xs" style={{ color: WorkoutTheme.text.secondary }}>
        {label}
      </Text>
    </View>
  );
}

export default function WorkoutStats({ exercises, estimatedTime }: WorkoutStatsProps) {
  const totalWeight = exercises.reduce((total, ex) => {
    return (
      total +
      ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0)
    );
  }, 0);

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <View className="mt-6 mb-5">
      <Text className="text-sm font-bold mb-3" style={{ color: WorkoutTheme.text.primary }}>
        Statistiques estimées
      </Text>
      <View className="flex-row gap-2">
        <StatItem
          icon="barbell"
          value={`${totalWeight.toFixed(0)}kg`}
          label="Poids total"
        />
        <StatItem
          icon="repeat"
          value={String(totalSets)}
          label="Séries"
        />
        <StatItem
          icon="timer"
          value={`${estimatedTime}m`}
          label="Durée"
        />
      </View>
    </View>
  );
}
