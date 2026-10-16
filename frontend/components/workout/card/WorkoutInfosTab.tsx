import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/exercises/ExerciseSetupItem";
import WorkoutActionButtons from "@/components/workout/card/WorkoutActionButtons";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";

import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
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
  onAddExercise?: (exercise: ExerciseSetupData) => void;
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
  onAddExercise,
}: WorkoutInfosTabProps) {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = React.useState(false);
  return (
    <ScrollView
      className="max-h-[600px] px-3 py-3"
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
      <View className="pb-3">
        <WorkoutActionButtons
          isEditing={isEditing}
          hasChanges={hasChanges}
          isSaving={isSaving}
          onEdit={onEdit}
          onDelete={onDelete}
          onSave={onSave}
          onCancel={onCancel}
        />

        <View className="mb-4">
          <Text className="text-xs font-semibold text-ink-soft mb-1.5 uppercase">
            {t.titleLabel}
          </Text>
          {isEditing ? (
            <TextInput
              className="bg-raised border border-line rounded-lg px-3 py-2.5 text-ink text-sm"
              value={editedTitle}
              onChangeText={onTitleChange}
              placeholderTextColor={WorkoutTheme.text.tertiary}
              editable
            />
          ) : (
            <Text className="text-sm text-ink leading-[20px]">
              {editedTitle}
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="text-xs font-semibold text-ink-soft mb-1.5 uppercase">
            {t.descriptionLabel}
          </Text>
          {isEditing ? (
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={editedDescription}
              onChangeText={onDescriptionChange}
              placeholderTextColor={WorkoutTheme.text.tertiary}
              placeholder={t.addDescriptionPlaceholder}
              multiline
              numberOfLines={3}
              editable
            />
          ) : (
            <Text className="text-sm text-ink leading-[20px]">
              {editedDescription || t.noDescription}
            </Text>
          )}
        </View>

        <View className="mt-2">
          <View className="mb-3">
            <Text className="pb-2.5 text-sm font-bold text-ink">
              {t.exercises} ({editedExercises.length})
            </Text>
            {isEditing && (
              <PressableScale
                onPress={() => setShowAddModal(true)}
                className="bg-accent rounded-full px-3 py-2 flex-row items-center justify-center ml-2"
              >
                <Ionicons name="add" size={16} color="white" />
                <Text
                  style={{
                    color: "white",
                    fontSize: 12,
                    fontWeight: "600",
                    textAlign: "center",
                    marginLeft: 6,
                  }}
                >
                  {t.add}
                </Text>
              </PressableScale>
            )}
          </View>

          {editedExercises.length > 0 ? (
            <View>
              {isEditing
                ?
                  editedExercises.map((exercise, index) => (
                    <ExerciseSetupItem
                      key={exercise.id}
                      exercise={exercise}
                      onUpdate={(updated) => onExerciseUpdate(index, updated)}
                      onRemove={() => onRemoveExercise(index)}
                    />
                  ))
                :
                  editedExercises.map((exercise, index) => (
                    <View
                      key={exercise.id}
                      className={`bg-raised border border-line rounded-lg px-3 py-2.5 ${index !== editedExercises.length - 1 ? "mb-2" : ""}`}
                    >
                      <View className="flex-row items-center gap-2 mb-3">
                        <Ionicons
                          name="barbell"
                          size={18}
                          color={WorkoutTheme.accent.purple}
                        />
                        <Text className="text-sm font-semibold text-ink flex-1">
                          {exercise.name}
                        </Text>
                        <View className="bg-accent rounded-full px-2 py-1 justify-center items-center">
                          <Text className="text-ink text-xs font-bold">
                            {format(t.setsCount, { n: exercise.sets.length })}
                          </Text>
                        </View>
                      </View>

                      <View className="gap-2.5">
                        {exercise.sets.map((set, setIndex) => (
                          <View
                            key={setIndex}
                            className="bg-background rounded-lg p-2.5 border border-line"
                          >
                            <Text className="text-xs font-semibold text-ink-soft mb-1.5">
                              {t.setLabel} {setIndex + 1}
                            </Text>
                            <View className="flex-row gap-2">
                              <View className="flex-1 flex-row items-center bg-surface px-2 py-1.5 rounded-md gap-1.5">
                                <Ionicons
                                  name="fitness"
                                  size={14}
                                  color={WorkoutTheme.accent.purple}
                                />
                                <Text className="text-xs font-semibold text-ink">
                                  {set.reps} {t.repsUnit}
                                </Text>
                              </View>
                              <View className="flex-1 flex-row items-center bg-surface px-2 py-1.5 rounded-md gap-1.5">
                                <Ionicons
                                  name="barbell"
                                  size={14}
                                  color={WorkoutTheme.status.success}
                                />
                                <Text className="text-xs font-semibold text-ink">
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
            <Text className="text-ink-muted text-sm text-center py-3">
              {t.noExerciseShort}
            </Text>
          )}
        </View>
      </View>
      <ExerciseSearch
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelectExercise={(exercise) => {
          const newExercise: ExerciseSetupData = {
            id: exercise.id,
            name: exercise.name,
            sets: [{ reps: 10, weight: 0 }],
          };
          if (onAddExercise) onAddExercise(newExercise);
          setShowAddModal(false);
        }}
        existingExerciseIds={editedExercises.map((ex) => ex.id)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
