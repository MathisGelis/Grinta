import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Alert, ActivityIndicator } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import { TokenService } from "@/services/token.service";
import {
  getWorkoutById,
  updatePlannedWorkout,
  UpdateWorkoutRequest,
  fullPlannedWorkout,
  deletePlannedWorkout,
} from "@/services/workouts.service";
import { getExercisesById, Exercise } from "@/services/exercises.service";
import { ExerciseSetupData } from "@/components/workout/exercises/ExerciseSetupItem";
import WorkoutTabs from "@/components/workout/card/WorkoutTabs";
import WorkoutInfosTab from "@/components/workout/card/WorkoutInfosTab";
import WorkoutStatsTab from "@/components/workout/card/WorkoutStatsTab";

import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";

export type WorkoutStatsTotals = {
  totalSets: number;
  totalReps: number;
  totalWeight: number;
};

export function computeWorkoutStats(
  workout: fullPlannedWorkout | null,
): WorkoutStatsTotals {
  let totalSets = 0;
  let totalReps = 0;
  let totalWeight = 0;
  if (!workout || !workout.exercises) return { totalSets, totalReps, totalWeight };

  workout.exercises.forEach((ex) => {
    totalSets += ex.sets.length;
    ex.sets.forEach((set) => {
      totalReps += set.reps || 0;
      totalWeight += (set.weight || 0) * (set.reps || 1);
    });
  });

  return { totalSets, totalReps, totalWeight: Math.round(totalWeight) };
}

interface WorkoutCardBodyProps {
  workout: {
    id: string;
    title: string;
    description?: string;
  };
  editedTitle: string;
  onEditedTitleChange: (title: string) => void;
  onLoaded: (workout: fullPlannedWorkout) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (updatedWorkout: fullPlannedWorkout) => void;
}

export default function WorkoutCardBody({
  workout,
  editedTitle,
  onEditedTitleChange,
  onLoaded,
  onDelete,
  onUpdate,
}: WorkoutCardBodyProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"infos" | "stats">("infos");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [fullWorkout, setFullWorkout] = useState<fullPlannedWorkout | null>(null);
  const [editedExercises, setEditedExercises] = useState<ExerciseSetupData[]>([]);
  const [editedDescription, setEditedDescription] = useState(
    workout.description || "",
  );
  const exercisesMapRef = useRef<Map<string, Exercise>>(new Map());

  const loadWorkoutData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await TokenService.get();
      const [data, exercisesMap] = await Promise.all([
        getWorkoutById(workout.id, token || undefined),
        getExercisesById().catch(() => new Map<string, Exercise>()),
      ]);
      exercisesMapRef.current = exercisesMap;

      if (!data.exercises) data.exercises = [];

      setFullWorkout(data);
      onLoaded(data);

      if (data.title) onEditedTitleChange(data.title);
      if (data.description !== undefined) setEditedDescription(data.description);

      setEditedExercises(
        data.exercises.map((ex) => ({
          id: ex.exerciseId,
          name:
            ex.exerciseName ||
            exercisesMap.get(ex.exerciseId)?.name ||
            ex.exerciseId,
          sets: ex.sets,
        })),
      );

      return data;
    } catch (error) {
      console.error("Erreur lors du chargement du workout:", error);
      Alert.alert(t.error, t.cannotLoadWorkoutDetails);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [t, workout.id, onLoaded, onEditedTitleChange]);

  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  const handleEdit = () => {
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleCancel = () => {
    if (fullWorkout && fullWorkout.exercises) {
      setEditedExercises(
        fullWorkout.exercises.map((ex) => ({
          id: ex.exerciseId,
          name: exercisesMapRef.current.get(ex.exerciseId)?.name || ex.exerciseId,
          sets: ex.sets,
        })),
      );
    }
    onEditedTitleChange(workout.title);
    setEditedDescription(workout.description || "");
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleExerciseUpdate = (index: number, updated: ExerciseSetupData) => {
    setEditedExercises((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
    setHasChanges(true);
  };

  const handleAddExercise = (exercise: ExerciseSetupData) => {
    setEditedExercises((prev) => [...prev, exercise]);
    setHasChanges(true);
  };

  const handleRemoveExercise = (index: number) => {
    setEditedExercises((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await TokenService.get();

      const updateData: UpdateWorkoutRequest = {
        title: editedTitle !== workout.title ? editedTitle : undefined,
        description:
          editedDescription !== (workout.description || "")
            ? editedDescription
            : undefined,
        exercises: editedExercises.map((ex) => ({
          exerciseId: ex.id,
          sets: ex.sets,
          plannedRestSeconds: 90,
        })),
      };

      Object.keys(updateData).forEach(
        (key) =>
          updateData[key as keyof UpdateWorkoutRequest] === undefined &&
          delete updateData[key as keyof UpdateWorkoutRequest],
      );

      await updatePlannedWorkout(workout.id, updateData, token || undefined);

      const updatedWorkout = await loadWorkoutData();
      setIsEditing(false);
      setHasChanges(false);

      if (onUpdate && updatedWorkout) onUpdate(updatedWorkout);

      Alert.alert(t.success, t.workoutUpdated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t.cannotSaveProfile;
      Alert.alert(t.error, message);
      console.error("Erreur de sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t.deleteWorkoutTitle,
      format(t.deleteWorkoutConfirm, { title: workout.title }),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          onPress: async () => {
            try {
              const token = await TokenService.get();
              await deletePlannedWorkout(workout.id, token || undefined);
              onDelete?.(workout.id);
              Alert.alert(t.success, t.workoutDeleted);
            } catch {
              Alert.alert(t.error, t.cannotDeleteWorkout);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  if (isLoading && !fullWorkout) {
    return (
      <View className="h-[300px] items-center justify-center">
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      </View>
    );
  }

  return (
    <>
      <WorkoutTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "infos" && (
        <WorkoutInfosTab
          isEditing={isEditing}
          hasChanges={hasChanges}
          isSaving={isSaving}
          editedTitle={editedTitle}
          editedDescription={editedDescription}
          editedExercises={editedExercises}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSave={handleSave}
          onCancel={handleCancel}
          onTitleChange={(text) => {
            onEditedTitleChange(text);
            setHasChanges(true);
          }}
          onDescriptionChange={(text) => {
            setEditedDescription(text);
            setHasChanges(true);
          }}
          onExerciseUpdate={handleExerciseUpdate}
          onRemoveExercise={handleRemoveExercise}
          onAddExercise={handleAddExercise}
        />
      )}

      {activeTab === "stats" && fullWorkout && (
        <WorkoutStatsTab
          workout={fullWorkout}
          stats={computeWorkoutStats(fullWorkout)}
        />
      )}
    </>
  );
}
