import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workoutCreation/ExerciseSetupItem";

interface ExerciseSectionProps {
  exercises: ExerciseSetupData[];
  onAdd: () => void;
  onUpdate: (updated: ExerciseSetupData) => void;
  onRemove: (id: string) => void;
}

export default function ExerciseSection({
  exercises,
  onAdd,
  onUpdate,
  onRemove,
}: ExerciseSectionProps) {
  return (
    <View className="mt-5">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text
          className="text-sm font-bold"
          style={{ color: WorkoutTheme.text.primary }}
        >
          Exercices ({exercises.length})
        </Text>
        <TouchableOpacity
          onPress={onAdd}
          className="px-2.5 py-2 ml-2 items-center justify-center"
        >
          <Ionicons
            name="add-circle"
            size={24}
            color={WorkoutTheme.accent.purple}
          />
        </TouchableOpacity>
      </View>

      {/* Liste ou état vide */}
      {exercises.length > 0 ? (
        <View>
          {exercises.map((exercise) => (
            <ExerciseSetupItem
              key={exercise.id}
              exercise={exercise}
              onUpdate={onUpdate}
              onRemove={() => onRemove(exercise.id)}
            />
          ))}
        </View>
      ) : (
        <View
          className="rounded-xl py-8 items-center gap-3 border"
          style={{
            backgroundColor: WorkoutTheme.backgroundSecondary,
            borderColor: WorkoutTheme.border,
          }}
        >
          <Ionicons
            name="barbell"
            size={40}
            color={WorkoutTheme.text.tertiary}
          />
          <Text
            className="text-sm font-semibold"
            style={{ color: WorkoutTheme.text.secondary }}
          >
            Aucun exercice ajouté
          </Text>
          <Text
            className="text-xs"
            style={{ color: WorkoutTheme.text.tertiary }}
          >
            Appuyez sur le bouton + pour ajouter un exercice
          </Text>
        </View>
      )}
    </View>
  );
}
