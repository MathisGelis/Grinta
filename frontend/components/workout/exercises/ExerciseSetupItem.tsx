import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

export interface ExerciseSetupData {
  id: string;
  name: string;
  sets: {
    reps: number;
    weight: number;
  }[];
}

interface ExerciseSetupItemProps {
  exercise: ExerciseSetupData;
  onUpdate: (updated: ExerciseSetupData) => void;
  onRemove: () => void;
}

export default function ExerciseSetupItem({
  exercise,
  onUpdate,
  onRemove,
}: ExerciseSetupItemProps) {
  const handleAddSet = () => {
    const newSet = {
      reps: exercise.sets[exercise.sets.length - 1]?.reps || 10,
      weight: exercise.sets[exercise.sets.length - 1]?.weight || 0,
    };
    onUpdate({
      ...exercise,
      sets: [...exercise.sets, newSet],
    });
  };

  const handleRemoveSet = (index: number) => {
    if (exercise.sets.length > 1) {
      onUpdate({
        ...exercise,
        sets: exercise.sets.filter((_, i) => i !== index),
      });
    }
  };

  const handleSetRepsChange = (index: number, value: string) => {
    const num = parseInt(value) || 1;
    const newSets = [...exercise.sets];
    newSets[index].reps = Math.max(1, num);
    onUpdate({ ...exercise, sets: newSets });
  };

  const handleSetWeightChange = (index: number, value: string) => {
    const num = parseFloat(value) || 0;
    const newSets = [...exercise.sets];
    newSets[index].weight = Math.max(0, num);
    onUpdate({ ...exercise, sets: newSets });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Ionicons
            name="barbell"
            size={18}
            color={WorkoutTheme.accent.purple}
          />
          <Text style={styles.name}>{exercise.name}</Text>
          <View style={styles.setBadge}>
            <Text style={styles.setBadgeText}>{exercise.sets.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash" size={18} color={WorkoutTheme.status.danger} />
        </TouchableOpacity>
      </View>

      {/* Sets List */}
      <View style={styles.setsContainer}>
        {exercise.sets.map((set, index) => (
          <View key={index} style={styles.setItem}>
            <Text style={styles.setNumber}>Série {index + 1}</Text>

            <View style={styles.setInputsRow}>
              {/* Reps Input */}
              <View style={styles.setInputGroup}>
                <Text style={styles.setInputLabel}>Reps</Text>
                <TextInput
                  style={styles.setInput}
                  value={set.reps.toString()}
                  onChangeText={(value) => handleSetRepsChange(index, value)}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor={WorkoutTheme.text.tertiary}
                />
              </View>

              {/* Weight Input */}
              <View style={styles.setInputGroup}>
                <Text style={styles.setInputLabel}>Poids (kg)</Text>
                <TextInput
                  style={styles.setInput}
                  value={set.weight.toString()}
                  onChangeText={(value) => handleSetWeightChange(index, value)}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  placeholderTextColor={WorkoutTheme.text.tertiary}
                />
              </View>

              {/* Remove Set Button */}
              {exercise.sets.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveSet(index)}
                  style={styles.removeSetButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={WorkoutTheme.status.danger}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Add Set Button */}
      <TouchableOpacity onPress={handleAddSet} style={styles.addSetButton}>
        <Ionicons
          name="add-circle-outline"
          size={18}
          color={WorkoutTheme.accent.purple}
        />
        <Text style={styles.addSetButtonText}>Ajouter une série</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  name: {
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
  removeButton: {
    padding: 6,
  },
  setsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  setItem: {
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
    marginBottom: 8,
  },
  setInputsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  setInputGroup: {
    flex: 1,
  },
  setInputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
    marginBottom: 4,
  },
  setInput: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    color: WorkoutTheme.text.primary,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: "center",
  },
  removeSetButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: WorkoutTheme.background,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: WorkoutTheme.accent.purple,
    borderStyle: "dashed",
  },
  addSetButtonText: {
    color: WorkoutTheme.accent.purple,
    fontSize: 12,
    fontWeight: "600",
  },
});
