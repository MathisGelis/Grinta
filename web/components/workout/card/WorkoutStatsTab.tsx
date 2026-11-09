import React from "react";
import { View, Text } from "react-native";
import { fullPlannedWorkout } from "@/services/workouts.service";
import MuscleMap from "@/components/ui/MuscleMap";
import Stat from "@/components/ui/Stat";
import { usePlannedMuscleData } from "@/hooks/usePlannedMuscleData";

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
  const muscleData = usePlannedMuscleData(workout?.exercises);
  const tiles = [
    { label: t.sets, value: stats.totalSets },
    { label: t.totalReps, value: stats.totalReps },
    { label: t.totalKgLabel, value: stats.totalWeight },
    { label: t.exercises, value: workout?.exercises?.length || 0 },
  ];

  return (
    <View className="gap-4 px-4 pb-4 pt-1">
      <View className="flex-row flex-wrap gap-3">
        {tiles.map((tile) => (
          <View
            key={tile.label}
            className="rounded-tile bg-raised p-4"
            style={{ width: "47.5%", flexGrow: 1 }}
          >
            <Stat size="md" value={tile.value} label={tile.label} />
          </View>
        ))}
      </View>

      {muscleData.length > 0 ? (
        <View className="gap-3 rounded-tile bg-raised p-4">
          <Text className="text-base font-semibold text-ink">
            {t.musclesWorkedTitle}
          </Text>
          <MuscleMap data={muscleData} unit={t.sets.toLowerCase()} />
        </View>
      ) : null}
    </View>
  );
}
