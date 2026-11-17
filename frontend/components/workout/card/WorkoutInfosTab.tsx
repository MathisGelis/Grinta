import { useUnits } from "@/contexts/UnitsContext";
import React from "react";
import { router } from "expo-router";
import { View, Text } from "react-native";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/exercises/ExerciseSetupItem";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";

import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import Card from "@/components/ui/Card";
import { useTranslation } from "@/contexts/LanguageContext";
import EmptyState from "@/components/ui/EmptyState";
interface WorkoutInfosTabProps {
  isEditing: boolean;
  editedExercises: ExerciseSetupData[];
  onExerciseUpdate: (index: number, updated: ExerciseSetupData) => void;
  onRemoveExercise: (index: number) => void;
  onAddExercise?: (exercise: ExerciseSetupData) => void;
}

export default function WorkoutInfosTab({
  isEditing,
  editedExercises,
  onExerciseUpdate,
  onRemoveExercise,
  onAddExercise,
}: WorkoutInfosTabProps) {
  const { t } = useTranslation();
  const { formatWeight } = useUnits();
  const [showAddModal, setShowAddModal] = React.useState(false);

  return (
    <View className="gap-5 px-5">
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-ink">
            {t.exercises} ({editedExercises.length})
          </Text>
          {isEditing ? (
            <PressableScale
              halo={false}
              hitSlop={12}
              onPress={() => setShowAddModal(true)}
              accessibilityRole="button"
              accessibilityLabel={t.addExerciseTitle}
            >
              <Ionicons name="add" size={26} color={WorkoutTheme.text.primary} />
            </PressableScale>
          ) : null}
        </View>

        {editedExercises.length === 0 ? (
          <EmptyState plain icon="barbell-outline" title={t.noExerciseShort} />
        ) : isEditing ? (
          editedExercises.map((exercise, index) => (
            <ExerciseSetupItem
              key={exercise.id}
              exercise={exercise}
              onUpdate={(updated) => onExerciseUpdate(index, updated)}
              onRemove={() => onRemoveExercise(index)}
              defaultRestSeconds={90}
            />
          ))
        ) : (
          editedExercises.map((exercise) => (
            <Card key={exercise.id} className="gap-4">
              <View
                className={`flex-row justify-between gap-3 ${exercise.sets.length === 0 ? "items-center" : "items-start"}`}
              >
                <Text className="flex-1 text-lg font-semibold text-ink">
                  {exercise.name}
                </Text>
                <View className="flex-row items-center gap-3">
                  {exercise.plannedRestSeconds !== undefined ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons
                        name="hourglass-outline"
                        size={14}
                        color={WorkoutTheme.text.primary}
                      />
                      <Text className="text-sm font-semibold text-ink-muted">
                        {exercise.plannedRestSeconds}s
                      </Text>
                    </View>
                  ) : null}
                  <PressableScale
                    halo={false}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={exercise.name}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/workouts/exercise-detail",
                        params: { exerciseId: exercise.id },
                      })
                    }
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={22}
                      color={WorkoutTheme.text.primary}
                    />
                  </PressableScale>
                </View>
              </View>
              {exercise.sets.length > 0 ? (
                <View className="gap-2">
                  {exercise.sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      className="flex-row items-center justify-between rounded-full bg-raised px-5 py-3"
                    >
                      <Text className="text-sm text-ink-muted">
                        {t.setLabel} {setIndex + 1}
                      </Text>
                      <Text className="text-base font-semibold text-ink">
                        {formatWeight(set.weight)} × {set.reps}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ))
        )}

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
