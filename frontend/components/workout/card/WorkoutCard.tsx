import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View } from "react-native";
import { fullPlannedWorkout } from "@/services/workouts.service";
import WorkoutCardHeader from "@/components/workout/card/WorkoutCardHeader";
import WorkoutCardBody, {
  computeWorkoutStats,
} from "@/components/workout/card/WorkoutCardBody";

interface WorkoutCardProps {
  workout: {
    id: string;
    title: string;
    description?: string;
    totalExercises?: number;
  };
  onDelete?: (id: string) => void;
  onUpdate?: (updatedWorkout: fullPlannedWorkout) => void;
}

function WorkoutCard({ workout, onDelete, onUpdate }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const [fullWorkout, setFullWorkout] = useState<fullPlannedWorkout | null>(null);
  const [editedTitle, setEditedTitle] = useState(workout.title);

  useEffect(() => {
    setEditedTitle(workout.title);
  }, [workout.title]);

  const toggleExpand = useCallback(() => {
    setHasExpanded(true);
    setIsExpanded((prev) => !prev);
  }, []);

  const stats = useMemo(() => computeWorkoutStats(fullWorkout), [fullWorkout]);

  return (
    <View className="w-full pb-3">
      <View className="overflow-hidden rounded-card bg-surface">
        <WorkoutCardHeader
          title={editedTitle}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          totalExercises={
            fullWorkout?.exercises?.length ?? workout.totalExercises ?? 0
          }
          stats={{
            totalSets: stats.totalSets,
            totalWeight: stats.totalWeight,
          }}
          hasWorkout={!!fullWorkout}
        />

        {hasExpanded && (
          <View className="bg-surface" style={isExpanded ? undefined : { display: "none" }}>
            <WorkoutCardBody
              workout={workout}
              editedTitle={editedTitle}
              onEditedTitleChange={setEditedTitle}
              onLoaded={setFullWorkout}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          </View>
        )}
      </View>
    </View>
  );
}

export default React.memo(WorkoutCard);
