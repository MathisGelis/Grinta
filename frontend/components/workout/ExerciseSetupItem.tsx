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
  sets: number;
  reps: number;
  weight: number;
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
  const handleSetsChange = (value: string) => {
    const num = parseInt(value) || 1;
    onUpdate({ ...exercise, sets: Math.max(1, num) });
  };

  const handleRepsChange = (value: string) => {
    const num = parseInt(value) || 1;
    onUpdate({ ...exercise, reps: Math.max(1, num) });
  };

  const handleWeightChange = (value: string) => {
    const num = parseFloat(value) || 0;
    onUpdate({ ...exercise, weight: Math.max(0, num) });
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
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="trash" size={18} color={WorkoutTheme.status.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputsContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Séries</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={exercise.sets.toString()}
              onChangeText={handleSetsChange}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reps</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={exercise.reps.toString()}
              onChangeText={handleRepsChange}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Poids (kg)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={exercise.weight.toString()}
              onChangeText={handleWeightChange}
              keyboardType="decimal-pad"
              maxLength={5}
            />
          </View>
        </View>
      </View>
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
  removeButton: {
    padding: 6,
  },
  inputsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
    marginBottom: 4,
  },
  inputWrapper: {
    backgroundColor: WorkoutTheme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    paddingHorizontal: 8,
  },
  input: {
    color: WorkoutTheme.text.primary,
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 8,
    textAlign: "center",
  },
});
