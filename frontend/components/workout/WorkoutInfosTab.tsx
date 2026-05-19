import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSetupItem, { ExerciseSetupData } from "./ExerciseSetupItem";
import WorkoutActionButtons from "./WorkoutActionButtons";

interface WorkoutInfosTabProps {
  isEditing: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  editedTitle: string;
  editedDescription: string;
  editedExercises: ExerciseSetupData[];
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onExerciseUpdate: (index: number, updated: ExerciseSetupData) => void;
  onRemoveExercise: (index: number) => void;
}

export default function WorkoutInfosTab({
  isEditing,
  hasChanges,
  isSaving,
  editedTitle,
  editedDescription,
  editedExercises,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onTitleChange,
  onDescriptionChange,
  onExerciseUpdate,
  onRemoveExercise,
}: WorkoutInfosTabProps) {
  return (
    <ScrollView
      style={styles.tabContent}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
      <View style={styles.infosContent}>
        {/* Action Buttons */}
        <WorkoutActionButtons
          isEditing={isEditing}
          hasChanges={hasChanges}
          isSaving={isSaving}
          onEdit={onEdit}
          onDelete={onDelete}
          onSave={onSave}
          onCancel={onCancel}
        />

        {/* Title Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Titre</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={editedTitle}
              onChangeText={onTitleChange}
              placeholderTextColor={WorkoutTheme.text.tertiary}
              editable
            />
          ) : (
            <Text style={styles.fieldValue}>{editedTitle}</Text>
          )}
        </View>

        {/* Description Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          {isEditing ? (
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={editedDescription}
              onChangeText={onDescriptionChange}
              placeholderTextColor={WorkoutTheme.text.tertiary}
              placeholder="Ajouter une description..."
              multiline
              numberOfLines={3}
              editable
            />
          ) : (
            <Text style={styles.fieldValue}>
              {editedDescription || "Pas de description"}
            </Text>
          )}
        </View>

        {/* Exercises Section */}
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Exercices ({editedExercises.length})
            </Text>
          </View>

          {editedExercises.length > 0 ? (
            <View>
              {isEditing
                ? // Edit mode: use ExerciseSetupItem
                  editedExercises.map((exercise, index) => (
                    <ExerciseSetupItem
                      key={exercise.id}
                      exercise={exercise}
                      onUpdate={(updated) => onExerciseUpdate(index, updated)}
                      onRemove={() => onRemoveExercise(index)}
                    />
                  ))
                : // Display mode: show exercise with series details
                  editedExercises.map((exercise, index) => (
                    <View
                      key={exercise.id}
                      style={[
                        styles.exerciseCard,
                        index !== editedExercises.length - 1 &&
                          styles.exerciseCardBorder,
                      ]}
                    >
                      <View style={styles.exerciseHeader}>
                        <Ionicons
                          name="barbell"
                          size={18}
                          color={WorkoutTheme.accent.purple}
                        />
                        <Text style={styles.exerciseCardName}>
                          {exercise.name}
                        </Text>
                        <View style={styles.setBadge}>
                          <Text style={styles.setBadgeText}>
                            {exercise.sets.length} séries
                          </Text>
                        </View>
                      </View>

                      {/* Sets Display */}
                      <View style={styles.setsDisplay}>
                        {exercise.sets.map((set, setIndex) => (
                          <View key={setIndex} style={styles.setDisplayItem}>
                            <Text style={styles.setNumber}>
                              Série {setIndex + 1}
                            </Text>
                            <View style={styles.setDisplayDetails}>
                              <View style={styles.setDetailBadge}>
                                <Ionicons
                                  name="fitness"
                                  size={14}
                                  color={WorkoutTheme.accent.purple}
                                />
                                <Text style={styles.setDetailText}>
                                  {set.reps} reps
                                </Text>
                              </View>
                              <View style={styles.setDetailBadge}>
                                <Ionicons
                                  name="barbell"
                                  size={14}
                                  color={WorkoutTheme.status.success}
                                />
                                <Text style={styles.setDetailText}>
                                  {set.weight} kg
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Aucun exercice</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    maxHeight: 600,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infosContent: {
    paddingBottom: 12,
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
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  exerciseCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: WorkoutTheme.text.primary,
    flex: 1,
  },
  setBadge: {
    backgroundColor: WorkoutTheme.accent.purple,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  setBadgeText: {
    color: WorkoutTheme.text.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  setsDisplay: {
    gap: 10,
  },
  setDisplayItem: {
    backgroundColor: WorkoutTheme.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  setNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
    marginBottom: 6,
  },
  setDisplayDetails: {
    flexDirection: "row",
    gap: 8,
  },
  setDetailBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WorkoutTheme.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  setDetailText: {
    fontSize: 12,
    fontWeight: "600",
    color: WorkoutTheme.text.primary,
  },
  emptyText: {
    color: WorkoutTheme.text.tertiary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
  },
});
