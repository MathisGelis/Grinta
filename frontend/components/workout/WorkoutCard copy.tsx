import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { TokenService } from "@/services/token.service";
import {
  getWorkoutById,
  updatePlannedWorkout,
  UpdateWorkoutRequest,
} from "@/services/workouts.service";

export interface WorkoutExercise {
  id: string;
  name: string;
  weight?: number;
  reps?: number;
  sets?: number;
  unit?: string;
}

export interface WorkoutStats {
  estimatedTime: number; // in minutes
  totalWeight: number; // in kg
  estimatedCalories: number;
  muscleGroups: string[];
  totalSets: number;
}

export interface WorkoutCardData {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  exercises: WorkoutExercise[];
  stats: WorkoutStats;
}

interface WorkoutCardProps {
  workout: WorkoutCardData;
  onDelete?: () => void;
  onUpdate?: (updatedWorkout: WorkoutCardData) => void;
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
  const [editedWorkout, setEditedWorkout] = useState<WorkoutCardData>(workout);
  const [hasChanges, setHasChanges] = useState(false);

  // Vérifier si des changements ont été faits
  const checkChanges = (edited: WorkoutCardData) => {
    const changed =
      edited.name !== workout.name ||
      edited.description !== workout.description ||
      JSON.stringify(edited.exercises) !== JSON.stringify(workout.exercises);
    setHasChanges(changed);
  };

  const handleTitleChange = (text: string) => {
    const updated = { ...editedWorkout, name: text };
    setEditedWorkout(updated);
    checkChanges(updated);
  };

  const handleDescriptionChange = (text: string) => {
    const updated = { ...editedWorkout, description: text };
    setEditedWorkout(updated);
    checkChanges(updated);
  };

  const handleExerciseChange = (
    index: number,
    field: keyof WorkoutExercise,
    value: any,
  ) => {
    const updated = { ...editedWorkout };
    updated.exercises[index] = {
      ...updated.exercises[index],
      [field]: value,
    };
    setEditedWorkout(updated);
    checkChanges(updated);
  };

  const openWorkoutDetails = (id: string) => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      getWorkoutById(id);
    }
  };

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: string,
    value: any,
  ) => {
    const updated = { ...editedWorkout };
    // Pour cet exemple, on gère pas les sets détaillés, mais on peut l'ajouter
    setEditedWorkout(updated);
    checkChanges(updated);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const token = await TokenService.get();

      // Préparer les données de la requête
      const updateData: UpdateWorkoutRequest = {
        title: editedWorkout.name,
        description: editedWorkout.description,
        exercises: editedWorkout.exercises.map((ex) => ({
          exerciseId: ex.id,
          sets: [
            {
              reps: ex.reps || 0,
              weight: ex.weight || 0,
            },
          ],
          plannedRestSeconds: 90, // Default value
        })),
      };

      await updatePlannedWorkout(workout.id, updateData, token || undefined);

      // Mettre à jour le state local
      setEditedWorkout(editedWorkout);
      setHasChanges(false);
      setIsEditing(false);

      // Notifier le parent
      if (onUpdate) {
        onUpdate(editedWorkout);
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

  const handleDeletePress = () => {
    Alert.alert(
      "Supprimer la séance",
      `Êtes-vous sûr de vouloir supprimer "${workout.name}" ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          onPress: onDelete,
          style: "destructive",
        },
      ],
    );
  };

  const handleCancelEdit = () => {
    setEditedWorkout(workout);
    setHasChanges(false);
    setIsEditing(false);
  };

  // Données fictives pour les statistiques
  const fakeStats = {
    totalWorkouts: 12,
    lastWorkout: "Il y a 2 jours",
    personalBest: "150 kg",
    averageCalories: 320,
    totalTime: "45 min",
  };

  return (
    <View style={[styles.container, { marginBottom: 16 }]}>
      <View style={styles.card}>
        {/* Image Background */}
        <ImageBackground
          source={
            workout.image_url
              ? { uri: workout.image_url }
              : require("@/assets/onboarding1.jpg")
          }
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Dark overlay */}
          <View style={styles.darkOverlay} />

          {/* Header info */}
          <View style={styles.headerContent}>
            <Text style={styles.workoutName}>{workout.name}</Text>
          </View>

          {/* Bottom bar with stats */}
          <View style={styles.bottomBar}>
            <View style={styles.statsContainer}>
              <View style={styles.statBadge}>
                <Ionicons
                  name="flame"
                  size={14}
                  color={WorkoutTheme.status.danger}
                />
                <Text style={styles.statBadgeText}>
                  {workout.stats.estimatedCalories} kcal
                </Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons
                  name="time"
                  size={14}
                  color={WorkoutTheme.status.info}
                />
                <Text style={styles.statBadgeText}>
                  {workout.stats.estimatedTime}m
                </Text>
              </View>
            </View>

            {/* Menu toggle button */}
            <TouchableOpacity
              onPress={() => openWorkoutDetails(workout.id)}
              style={styles.menuButton}
            >
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={WorkoutTheme.accent.purple}
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "infos" && styles.activeTab]}
                onPress={() => setActiveTab("infos")}
              >
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={
                    activeTab === "infos"
                      ? WorkoutTheme.accent.purple
                      : WorkoutTheme.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "infos" && styles.activeTabText,
                  ]}
                >
                  Infos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === "stats" && styles.activeTab]}
                onPress={() => setActiveTab("stats")}
              >
                <Ionicons
                  name="bar-chart"
                  size={16}
                  color={
                    activeTab === "stats"
                      ? WorkoutTheme.accent.purple
                      : WorkoutTheme.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "stats" && styles.activeTabText,
                  ]}
                >
                  Stats
                </Text>
              </TouchableOpacity>
            </View>
            Tab content
            <ScrollView
              style={styles.tabContent}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            >
              {activeTab === "infos" && (
                <View style={styles.infosContent}>
                  {/* Edit/Save buttons */}
                  <View style={styles.actionButtonsRow}>
                    {!isEditing ? (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          flex: 1,
                          width: "100%",
                        }}
                      >
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => setIsEditing(true)}
                        >
                          <Ionicons
                            name="pencil"
                            size={16}
                            color={WorkoutTheme.text.primary}
                          />
                          <Text style={styles.editButtonText}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={handleDeletePress}
                        >
                          <Ionicons
                            name="trash"
                            size={16}
                            color={WorkoutTheme.text.primary}
                          />
                          <Text style={styles.deleteButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          flex: 1,
                          width: "100%",
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.saveButton,
                            !hasChanges && styles.disabledButton,
                          ]}
                          onPress={handleSaveChanges}
                          disabled={!hasChanges || isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator
                              size="small"
                              color={WorkoutTheme.text.primary}
                            />
                          ) : (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={WorkoutTheme.text.primary}
                              />
                              <Text style={styles.saveButtonText}>
                                Enregistrer
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={handleCancelEdit}
                          disabled={isSaving}
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={WorkoutTheme.text.primary}
                          />
                          <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  {/* Title */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Titre</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.textInput}
                        value={editedWorkout.name}
                        onChangeText={handleTitleChange}
                        placeholderTextColor={WorkoutTheme.text.tertiary}
                        editable
                      />
                    ) : (
                      <Text style={styles.fieldValue}>
                        {editedWorkout.name}
                      </Text>
                    )}
                  </View>
                  Description
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Description</Text>
                    {isEditing ? (
                      <TextInput
                        style={[styles.textInput, styles.multilineInput]}
                        value={editedWorkout.description || ""}
                        onChangeText={handleDescriptionChange}
                        placeholderTextColor={WorkoutTheme.text.tertiary}
                        placeholder="Ajouter une description..."
                        multiline
                        numberOfLines={3}
                        editable
                      />
                    ) : (
                      <Text style={styles.fieldValue}>
                        {editedWorkout.description || "Pas de description"}
                      </Text>
                    )}
                  </View>
                  Exercises Card
                  <View style={styles.exercisesSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        Exercices ({editedWorkout.exercises.length})
                      </Text>
                    </View>

                    {editedWorkout.exercises.length > 0 ? (
                      <View>
                        {editedWorkout.exercises.map((exercise, index) => (
                          <View
                            key={exercise.id}
                            style={[
                              styles.exerciseCard,
                              index !== editedWorkout.exercises.length - 1 &&
                                styles.exerciseCardBorder,
                            ]}
                          >
                            {isEditing ? (
                              <View>
                                <TextInput
                                  style={styles.exerciseNameInput}
                                  value={exercise.name}
                                  onChangeText={(text) =>
                                    handleExerciseChange(index, "name", text)
                                  }
                                  placeholder="Nom de l'exercice"
                                  placeholderTextColor={
                                    WorkoutTheme.text.tertiary
                                  }
                                />
                                <View style={styles.exerciseEditRow}>
                                  <View style={styles.exerciseEditField}>
                                    <Text style={styles.exerciseEditLabel}>
                                      Séries
                                    </Text>
                                    <TextInput
                                      style={styles.exerciseEditInput}
                                      value={String(exercise.sets || 0)}
                                      onChangeText={(text) =>
                                        handleExerciseChange(
                                          index,
                                          "sets",
                                          parseInt(text) || 0,
                                        )
                                      }
                                      keyboardType="numeric"
                                      placeholder="0"
                                    />
                                  </View>
                                  <View style={styles.exerciseEditField}>
                                    <Text style={styles.exerciseEditLabel}>
                                      Reps
                                    </Text>
                                    <TextInput
                                      style={styles.exerciseEditInput}
                                      value={String(exercise.reps || 0)}
                                      onChangeText={(text) =>
                                        handleExerciseChange(
                                          index,
                                          "reps",
                                          parseInt(text) || 0,
                                        )
                                      }
                                      keyboardType="numeric"
                                      placeholder="0"
                                    />
                                  </View>
                                  <View style={styles.exerciseEditField}>
                                    <Text style={styles.exerciseEditLabel}>
                                      Poids (kg)
                                    </Text>
                                    <TextInput
                                      style={styles.exerciseEditInput}
                                      value={String(exercise.weight || 0)}
                                      onChangeText={(text) =>
                                        handleExerciseChange(
                                          index,
                                          "weight",
                                          parseFloat(text) || 0,
                                        )
                                      }
                                      keyboardType="decimal-pad"
                                      placeholder="0"
                                    />
                                  </View>
                                </View>
                              </View>
                            ) : (
                              <View>
                                <Text style={styles.exerciseCardName}>
                                  {exercise.name}
                                </Text>
                                <View style={styles.exerciseCardDetails}>
                                  {exercise.sets && (
                                    <View style={styles.exerciseDetailBadge}>
                                      <Ionicons
                                        name="repeat"
                                        size={12}
                                        color={WorkoutTheme.text.secondary}
                                      />
                                      <Text style={styles.exerciseDetailText}>
                                        {exercise.sets} séries
                                      </Text>
                                    </View>
                                  )}
                                  {exercise.reps && (
                                    <View style={styles.exerciseDetailBadge}>
                                      <Ionicons
                                        name="fitness"
                                        size={12}
                                        color={WorkoutTheme.text.secondary}
                                      />
                                      <Text style={styles.exerciseDetailText}>
                                        {exercise.reps} reps
                                      </Text>
                                    </View>
                                  )}
                                  {exercise.weight && (
                                    <View style={styles.exerciseDetailBadge}>
                                      <Ionicons
                                        name="barbell"
                                        size={12}
                                        color={WorkoutTheme.text.secondary}
                                      />
                                      <Text style={styles.exerciseDetailText}>
                                        {exercise.weight}{" "}
                                        {exercise.unit || "kg"}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>Aucun exercice</Text>
                    )}
                  </View>
                </View>
              )}

              {activeTab === "stats" && (
                <View style={styles.statsContent}>
                  {/* Fake stats data */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Ionicons
                        name="time"
                        size={24}
                        color={WorkoutTheme.accent.purple}
                      />
                      <Text style={styles.statBoxValue}>
                        {fakeStats.totalTime}
                      </Text>
                      <Text style={styles.statBoxLabel}>Durée moyenne</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Ionicons
                        name="flame"
                        size={24}
                        color={WorkoutTheme.status.danger}
                      />
                      <Text style={styles.statBoxValue}>
                        {fakeStats.averageCalories}
                      </Text>
                      <Text style={styles.statBoxLabel}>kcal moy</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Ionicons
                        name="barbell"
                        size={24}
                        color={WorkoutTheme.status.success}
                      />
                      <Text style={styles.statBoxValue}>
                        {fakeStats.personalBest}
                      </Text>
                      <Text style={styles.statBoxLabel}>Record perso</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Ionicons
                        name="repeat"
                        size={24}
                        color={WorkoutTheme.status.info}
                      />
                      <Text style={styles.statBoxValue}>
                        {fakeStats.totalWorkouts}
                      </Text>
                      <Text style={styles.statBoxLabel}>Total effectué</Text>
                    </View>
                  </View>

                  {/* Additional stats */}
                  <View style={styles.additionalStatsContainer}>
                    <View style={styles.additionalStatItem}>
                      <View style={styles.additionalStatHeader}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={WorkoutTheme.accent.purple}
                        />
                        <Text style={styles.additionalStatLabel}>
                          Dernier entraînement
                        </Text>
                      </View>
                      <Text style={styles.additionalStatValue}>
                        {fakeStats.lastWorkout}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        )}
        ;
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
  imageBackground: {
    height: 200,
    justifyContent: "space-between",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statBadgeText: {
    color: WorkoutTheme.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  menuButton: {
    padding: 8,
  },
  expandedContent: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: WorkoutTheme.border,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: WorkoutTheme.border,
    backgroundColor: WorkoutTheme.backgroundTertiary,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: WorkoutTheme.accent.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
  },
  activeTabText: {
    color: WorkoutTheme.accent.purple,
  },
  tabContent: {
    maxHeight: 500,
  },
  infosContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.accent.purple,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.status.danger,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.status.success,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.backgroundTertiary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  cancelButtonText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 14,
    color: WorkoutTheme.text.primary,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: WorkoutTheme.backgroundTertiary,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: WorkoutTheme.text.primary,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  exercisesSection: {
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
  exerciseCard: {
    backgroundColor: WorkoutTheme.backgroundTertiary,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exerciseCardBorder: {
    marginBottom: 8,
  },
  exerciseCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: WorkoutTheme.text.primary,
    marginBottom: 8,
  },
  exerciseCardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exerciseDetailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WorkoutTheme.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  exerciseDetailText: {
    fontSize: 12,
    color: WorkoutTheme.text.secondary,
  },
  exerciseNameInput: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  exerciseEditRow: {
    flexDirection: "row",
    gap: 8,
  },
  exerciseEditField: {
    flex: 1,
  },
  exerciseEditLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
    marginBottom: 4,
  },
  exerciseEditInput: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: WorkoutTheme.text.primary,
    fontSize: 12,
  },
  emptyText: {
    color: WorkoutTheme.text.tertiary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: WorkoutTheme.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: "700",
    color: WorkoutTheme.accent.purple,
    marginTop: 6,
  },
  statBoxLabel: {
    fontSize: 11,
    color: WorkoutTheme.text.secondary,
    marginTop: 4,
    textAlign: "center",
  },
  additionalStatsContainer: {
    marginTop: 12,
  },
  additionalStatItem: {
    backgroundColor: WorkoutTheme.backgroundTertiary,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  additionalStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  additionalStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
  },
  additionalStatValue: {
    fontSize: 14,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
});
