import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/exercises/ExerciseSetupItem";
import WorkoutActionButtons from "@/components/workout/card/WorkoutActionButtons";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";

import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
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
    <View className="gap-5 px-4 pb-4 pt-1">
      {isEditing ? (
        <View className="gap-4">
          <FormField label={t.titleLabel}>
            <TextField value={editedTitle} onChangeText={onTitleChange} />
          </FormField>
          <FormField label={t.descriptionLabel}>
            <TextField
              multiline
              value={editedDescription}
              onChangeText={onDescriptionChange}
              placeholder={t.addDescriptionPlaceholder}
            />
          </FormField>
        </View>
      ) : (
        <View className="gap-1 rounded-tile bg-raised p-4">
          <Text className="text-xs text-ink-muted">{t.descriptionLabel}</Text>
          <Text className="text-sm text-ink">
            {editedDescription || t.noDescription}
          </Text>
        </View>
      )}

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-ink">
            {t.exercises} ({editedExercises.length})
          </Text>
          <WorkoutActionButtons
            isEditing={isEditing}
            hasChanges={hasChanges}
            isSaving={isSaving}
            onEdit={onEdit}
            onDelete={onDelete}
            onSave={onSave}
            onCancel={onCancel}
          />
        </View>

        {editedExercises.length === 0 ? (
          <View className="items-center rounded-tile bg-raised p-6">
            <Text className="text-center text-sm text-ink-muted">
              {t.noExerciseShort}
            </Text>
          </View>
        ) : isEditing ? (
          editedExercises.map((exercise, index) => (
            <ExerciseSetupItem
              key={exercise.id}
              tone="raised"
              exercise={exercise}
              onUpdate={(updated) => onExerciseUpdate(index, updated)}
              onRemove={() => onRemoveExercise(index)}
            />
          ))
        ) : (
          editedExercises.map((exercise) => (
            <View key={exercise.id} className="gap-3 rounded-tile bg-raised p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
                  <Ionicons
                    name="barbell"
                    size={18}
                    color={WorkoutTheme.accent.purple}
                  />
                </View>
                <Text
                  className="flex-1 text-base font-semibold text-ink"
                  numberOfLines={2}
                >
                  {exercise.name}
                </Text>
                <View className="h-7 justify-center rounded-full bg-accent-tint px-3">
                  <Text className="text-xs font-medium text-accent-text">
                    {format(t.setsCount, { n: exercise.sets.length })}
                  </Text>
                </View>
              </View>

              <View className="gap-2">
                {exercise.sets.map((set, setIndex) => (
                  <View
                    key={setIndex}
                    className="flex-row items-center justify-between rounded-full bg-surface px-4 py-2.5"
                  >
                    <Text className="text-sm text-ink-muted">
                      {t.setLabel} {setIndex + 1}
                    </Text>
                    <Text className="text-sm font-semibold text-ink">
                      {set.weight} kg × {set.reps}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {isEditing ? (
          <Button
            variant="secondary"
            icon="add"
            label={t.addExerciseTitle}
            onPress={() => setShowAddModal(true)}
          />
        ) : null}
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
    </View>
  );
}
