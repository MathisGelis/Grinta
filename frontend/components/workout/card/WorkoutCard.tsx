import React, { useCallback } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import WorkoutCardHeader from "@/components/workout/card/WorkoutCardHeader";

interface WorkoutCardProps {
  workout: {
    id: string;
    title: string;
    description?: string;
    totalExercises?: number;
    totalSets?: number;
  };
  /** Appelé juste avant l'ouverture de la page (ex. pour fermer une feuille). */
  onOpen?: () => void;
}

/** Card d'une séance : ouvre la page de détail de la séance. */
function WorkoutCard({ workout, onOpen }: WorkoutCardProps) {
  const open = useCallback(() => {
    onOpen?.();
    router.push({
      pathname: "/(tabs)/workouts/workout-detail",
      params: { workoutId: workout.id, title: workout.title },
    } as any);
  }, [onOpen, workout.id, workout.title]);

  return (
    <View className="w-full pb-3">
      <View className="overflow-hidden rounded-card bg-surface">
        <WorkoutCardHeader
          title={workout.title}
          onPress={open}
          totalExercises={workout.totalExercises ?? 0}
          totalSets={workout.totalSets}
        />
      </View>
    </View>
  );
}

export default React.memo(WorkoutCard);
