import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

export interface FilterOptions {
  muscleGroups?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: "all" | "short" | "medium" | "long"; // <45min, 45-90min, >90min
}

interface WorkoutFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  currentFilters?: FilterOptions;
}

const MUSCLE_GROUPS = [
  "Poitrine",
  "Dos",
  "Jambes",
  "Épaules",
  "Bras",
  "Abdominaux",
];

const DIFFICULTY_LEVELS = [
  { id: "beginner", label: "Débutant" },
  { id: "intermediate", label: "Intermédiaire" },
  { id: "advanced", label: "Avancé" },
];

const DURATION_OPTIONS = [
  { id: "all", label: "Tous" },
  { id: "short", label: "< 45 min" },
  { id: "medium", label: "45-90 min" },
  { id: "long", label: "> 90 min" },
];

export default function WorkoutFilter({
  onFilterChange,
  currentFilters = {},
}: WorkoutFilterProps) {
  const [selectedMuscles, setSelectedMuscles] = React.useState<string[]>(
    currentFilters.muscleGroups || [],
  );
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<
    "beginner" | "intermediate" | "advanced" | null
  >(currentFilters.difficulty || null);
  const [selectedDuration, setSelectedDuration] = React.useState<
    "all" | "short" | "medium" | "long"
  >(currentFilters.duration || "all");

  React.useEffect(() => {
    onFilterChange({
      muscleGroups: selectedMuscles.length > 0 ? selectedMuscles : undefined,
      difficulty: selectedDifficulty || undefined,
      duration: selectedDuration,
    });
  }, [selectedMuscles, selectedDifficulty, selectedDuration]);

  const toggleMuscle = (muscle: string) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const clearFilters = () => {
    setSelectedMuscles([]);
    setSelectedDifficulty(null);
    setSelectedDuration("all");
  };

  return (
    <View style={styles.container}>
      {/* Header with clear button */}
      <View style={styles.header}>
        <Text style={styles.title}>Filtres</Text>
        {(selectedMuscles.length > 0 ||
          selectedDifficulty ||
          selectedDuration !== "all") && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearButton}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Muscle Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscles</Text>
          <View style={styles.optionsWrap}>
            {MUSCLE_GROUPS.map((muscle) => (
              <TouchableOpacity
                key={muscle}
                style={[
                  styles.option,
                  selectedMuscles.includes(muscle) && styles.optionActive,
                ]}
                onPress={() => toggleMuscle(muscle)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedMuscles.includes(muscle) && styles.optionTextActive,
                  ]}
                >
                  {muscle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulté</Text>
          <View style={styles.optionsWrap}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.option,
                  selectedDifficulty === level.id && styles.optionActive,
                ]}
                onPress={() =>
                  setSelectedDifficulty(
                    selectedDifficulty === level.id ? null : (level.id as any),
                  )
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedDifficulty === level.id && styles.optionTextActive,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durée</Text>
          <View style={styles.optionsWrap}>
            {DURATION_OPTIONS.map((duration) => (
              <TouchableOpacity
                key={duration.id}
                style={[
                  styles.option,
                  selectedDuration === duration.id && styles.optionActive,
                ]}
                onPress={() => setSelectedDuration(duration.id as any)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedDuration === duration.id && styles.optionTextActive,
                  ]}
                >
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
  clearButton: {
    color: WorkoutTheme.accent.purple,
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: WorkoutTheme.text.secondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  optionActive: {
    backgroundColor: WorkoutTheme.accent.purpleDark,
    borderColor: WorkoutTheme.accent.purple,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "500",
    color: WorkoutTheme.text.secondary,
  },
  optionTextActive: {
    color: WorkoutTheme.text.primary,
    fontWeight: "600",
  },
});
