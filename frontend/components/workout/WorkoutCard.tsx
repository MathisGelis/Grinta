import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import { TokenService } from "@/services/token.service";
import {
  getWorkoutById,
  updatePlannedWorkout,
  UpdateWorkoutRequest,
  fullPlannedWorkout,
  deletePlannedWorkout,
} from "@/services/workouts.service";
import { getAllExercises, Exercise } from "@/services/exercises.service";
import { ExerciseSetupData } from "./ExerciseSetupItem";
import WorkoutCardHeader from "./WorkoutCardHeader";
import WorkoutTabs from "./WorkoutTabs";
import WorkoutInfosTab from "./WorkoutInfosTab";
import WorkoutStatsTab from "./WorkoutStatsTab";

interface WorkoutCardProps {
  workout: {
    id: string;
    title: string;
    description?: string;
    totalExercises?: number;
  };
  onDelete?: () => void;
  onUpdate?: (updatedWorkout: fullPlannedWorkout) => void;
  onPress?: () => void;
}

export default function WorkoutCard({
  workout,
  onDelete,
  onUpdate,
  onPress,
}: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"infos" | "stats">("infos");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Workout data
  const [fullWorkout, setFullWorkout] = useState<fullPlannedWorkout | null>(
    null,
  );
  const [editedExercises, setEditedExercises] = useState<ExerciseSetupData[]>(
    [],
  );
  const [editedTitle, setEditedTitle] = useState(workout.title);
  const [editedDescription, setEditedDescription] = useState(
    workout.description || "",
  );
  const [exercisesMap, setExercisesMap] = useState<Map<string, Exercise>>(
    new Map(),
  );

  useEffect(() => {
    loadExercisesMap();
  }, []);

  useEffect(() => {
    if (!isEditing && !isLoading) {
      setEditedTitle(workout.title);
      setEditedDescription(workout.description || "");
    }
  }, [workout.title, workout.description, isEditing, isLoading]);

  const loadExercisesMap = async () => {
    try {
      const exercises = await getAllExercises();
      const map = new Map<string, Exercise>();
      exercises.forEach((ex) => {
        map.set(ex.id, ex);
      });
      setExercisesMap(map);
    } catch (error) {
      console.error("Erreur lors du chargement des exercices:", error);
    }
  };

  const loadWorkoutData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await TokenService.get();
      const data = await getWorkoutById(workout.id, token || undefined);

      // Ensure exercises array exists
      if (!data.exercises) {
        data.exercises = [];
      }

      setFullWorkout(data);
      console.log(
        "Détails du workout chargés: \n",
        JSON.stringify(data, null, 2),
      );

      if (data.title) {
        setEditedTitle(data.title);
      }
      if (data.description !== undefined) {
        setEditedDescription(data.description);
      }

      const enrichedExercises = data.exercises.map((ex) => ({
        id: ex.exerciseId,
        name:
          ex.exerciseName ||
          exercisesMap.get(ex.exerciseId)?.name ||
          ex.exerciseId,
        sets: ex.sets,
      }));
      setEditedExercises(enrichedExercises);

      return data;
    } catch (error) {
      console.error("Erreur lors du chargement du workout:", error);
      Alert.alert("Erreur", "Impossible de charger les détails de la séance");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [workout.id, exercisesMap]);

  useEffect(() => {
    if (isExpanded && !fullWorkout) {
      loadWorkoutData();
    }
  }, [isExpanded, fullWorkout, loadWorkoutData]);

  const handleEdit = () => {
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleCancel = () => {
    if (fullWorkout && fullWorkout.exercises) {
      const enrichedExercises = fullWorkout.exercises.map((ex) => ({
        id: ex.exerciseId,
        name: exercisesMap.get(ex.exerciseId)?.name || ex.exerciseId,
        sets: ex.sets,
      }));
      setEditedExercises(enrichedExercises);
    }
    setEditedTitle(workout.title);
    setEditedDescription(workout.description || "");
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleExerciseUpdate = (index: number, updated: ExerciseSetupData) => {
    const newExercises = [...editedExercises];
    newExercises[index] = updated;
    setEditedExercises(newExercises);
    setHasChanges(true);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = editedExercises.filter((_, i) => i !== index);
    setEditedExercises(newExercises);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await TokenService.get();

      // Prepare update request
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

      // Remove undefined values
      Object.keys(updateData).forEach(
        (key) =>
          updateData[key as keyof UpdateWorkoutRequest] === undefined &&
          delete updateData[key as keyof UpdateWorkoutRequest],
      );

      await updatePlannedWorkout(workout.id, updateData, token || undefined);

      const updatedWorkout = await loadWorkoutData();
      setIsEditing(false);
      setHasChanges(false);

      if (onUpdate && updatedWorkout) {
        onUpdate(updatedWorkout);
      }

      Alert.alert("Succès", "La séance a été mise à jour avec succès.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      Alert.alert("Erreur", message);
      console.error("Erreur de sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer la séance",
      `Êtes-vous sûr de vouloir supprimer "${workout.title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          onPress: async () => {
            try {
              const token = await TokenService.get();
              await deletePlannedWorkout(workout.id, token || undefined);
              if (onDelete) onDelete();
              Alert.alert("Succès", "La séance a été supprimée.");
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer la séance.");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const calculateStats = () => {
    if (!fullWorkout || !fullWorkout.exercises)
      return { totalSets: 0, totalReps: 0, totalWeight: 0 };

    let totalSets = 0;
    let totalReps = 0;
    let totalWeight = 0;

    fullWorkout.exercises.forEach((ex) => {
      totalSets += ex.sets.length;
      ex.sets.forEach((set) => {
        totalReps += set.reps || 0;
        totalWeight += (set.weight || 0) * (set.reps || 1);
      });
    });

    return { totalSets, totalReps, totalWeight: Math.round(totalWeight) };
  };

  const stats = calculateStats();

  return (
    <View style={[styles.container, { marginBottom: 16 }]}>
      <View style={styles.card}>
        {/* Header */}
        <WorkoutCardHeader
          title={editedTitle}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          totalExercises={
            fullWorkout?.exercises?.length ?? workout.totalExercises ?? 0
          }
          stats={{
            totalSets: stats.totalSets,
            totalWeight: stats.totalWeight,
          }}
          hasWorkout={!!fullWorkout}
        />

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={WorkoutTheme.accent.purple}
                />
              </View>
            ) : (
              <>
                {/* Tabs */}
                <WorkoutTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Tab Content */}
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
                      setEditedTitle(text);
                      setHasChanges(true);
                    }}
                    onDescriptionChange={(text) => {
                      setEditedDescription(text);
                      setHasChanges(true);
                    }}
                    onExerciseUpdate={handleExerciseUpdate}
                    onRemoveExercise={handleRemoveExercise}
                  />
                )}

                {activeTab === "stats" && fullWorkout && (
                  <WorkoutStatsTab workout={fullWorkout} stats={stats} />
                )}
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: WorkoutTheme.backgroundTertiary,
  },
  expandedContent: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: WorkoutTheme.border,
  },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
});
