import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { Exercise, getAllExercises } from "@/services/exercises.service";

export interface SelectedExercise extends Exercise {
  sets: number;
  reps: number;
  weight: number;
}

interface ExerciseSelectorProps {
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises?: string[];
  isVisible: boolean;
  onClose: () => void;
}

const MUSCLE_GROUPS = [
  "Biceps",
  "Triceps",
  "Abs",
  "Forearms",
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
];

const EQUIPMENT_TYPES = [
  { id: "none", label: "Poids du corps" },
  { id: "dumbbell", label: "Haltères" },
  { id: "barbell", label: "Barre" },
  { id: "machine", label: "Machine" },
  { id: "cable", label: "Poulie" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "resistance_band", label: "Bande élastique" },
];

export default function ExerciseSelector({
  onSelectExercise,
  selectedExercises,
  isVisible,
  onClose,
}: ExerciseSelectorProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les exercices quand le modal devient visible
  useEffect(() => {
    if (isVisible) {
      loadExercises();
    }
  }, [isVisible]);

  const loadExercises = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllExercises();
      setExercises(data);
    } catch (err) {
      console.error("Erreur lors du chargement des exercices:", err);
      setError("Impossible de charger les exercices");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMuscle = (muscle: string) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const toggleEquipment = (equipment: string) => {
    if (selectedEquipment.includes(equipment)) {
      setSelectedEquipment(selectedEquipment.filter((e) => e !== equipment));
    } else {
      setSelectedEquipment([...selectedEquipment, equipment]);
    }
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Search filter
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      // Muscle filter - filtre sur primary_muscle
      const matchesMuscle =
        selectedMuscles.length === 0 ||
        selectedMuscles.includes(exercise.primary_muscle);

      // Equipment filter - filtre sur equipment_type
      const matchesEquipment =
        selectedEquipment.length === 0 ||
        selectedEquipment.includes(exercise.equipment_type);

      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [searchText, selectedMuscles, selectedEquipment, exercises]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header with close button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sélectionner un exercice</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons
              name="close"
              size={24}
              color={WorkoutTheme.text.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color={WorkoutTheme.text.tertiary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Chercher un exercice..."
            placeholderTextColor={WorkoutTheme.text.tertiary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={WorkoutTheme.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Chargement des exercices...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle"
                size={24}
                color={WorkoutTheme.text.secondary}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadExercises}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Muscle Groups Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Muscles</Text>
                <View style={styles.filterWrap}>
                  {MUSCLE_GROUPS.map((muscle) => (
                    <TouchableOpacity
                      key={muscle}
                      style={[
                        styles.filterPill,
                        selectedMuscles.includes(muscle) &&
                          styles.filterPillActive,
                      ]}
                      onPress={() => toggleMuscle(muscle)}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          selectedMuscles.includes(muscle) &&
                            styles.filterPillTextActive,
                        ]}
                      >
                        {muscle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Equipment Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Équipement</Text>
                <View style={styles.filterWrap}>
                  {EQUIPMENT_TYPES.map((equipment) => (
                    <TouchableOpacity
                      key={equipment.id}
                      style={[
                        styles.filterPill,
                        selectedEquipment.includes(equipment.id) &&
                          styles.filterPillActive,
                      ]}
                      onPress={() => toggleEquipment(equipment.id)}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          selectedEquipment.includes(equipment.id) &&
                            styles.filterPillTextActive,
                        ]}
                      >
                        {equipment.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Exercises List */}
              <View style={styles.exercisesSection}>
                <Text style={styles.filterTitle}>
                  Exercices ({filteredExercises.length})
                </Text>
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise, index) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={[
                        styles.exerciseItem,
                        index !== filteredExercises.length - 1 &&
                          styles.exerciseItemBorder,
                      ]}
                      onPress={() => {
                        onSelectExercise(exercise);
                        setSearchText("");
                        setSelectedMuscles([]);
                        setSelectedEquipment([]);
                      }}
                    >
                      <View style={styles.exerciseContent}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.muscleTagsContainer}>
                          <View style={styles.muscleTag}>
                            <Text style={styles.muscleTagText}>
                              {exercise.primary_muscle}
                            </Text>
                          </View>
                          {exercise.secondary_muscles &&
                            exercise.secondary_muscles.length > 0 &&
                            exercise.secondary_muscles.map((muscle) => (
                              <View key={muscle} style={styles.muscleTag}>
                                <Text style={styles.muscleTagText}>
                                  {muscle}
                                </Text>
                              </View>
                            ))}
                        </View>
                        <View style={styles.equipmentBadge}>
                          <Ionicons
                            name="settings"
                            size={12}
                            color={WorkoutTheme.accent.purple}
                          />
                          <Text style={styles.equipmentText}>
                            {exercise.equipment_type}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name="add-circle"
                        size={24}
                        color={WorkoutTheme.accent.purple}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Aucun exercice trouvé</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: WorkoutTheme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 0,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: WorkoutTheme.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: WorkoutTheme.backgroundSecondary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  searchInput: {
    flex: 1,
    color: WorkoutTheme.text.primary,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
    marginBottom: 10,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: WorkoutTheme.accent.purpleDark,
    borderColor: WorkoutTheme.accent.purple,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: WorkoutTheme.text.secondary,
  },
  filterPillTextActive: {
    color: WorkoutTheme.text.primary,
    fontWeight: "600",
  },
  exercisesSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  exerciseItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: WorkoutTheme.border,
  },
  exerciseContent: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    color: WorkoutTheme.text.primary,
    marginBottom: 6,
  },
  muscleTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  muscleTag: {
    backgroundColor: WorkoutTheme.accent.purpleDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  muscleTagText: {
    fontSize: 11,
    color: WorkoutTheme.accent.purpleLight,
    fontWeight: "500",
  },
  equipmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  equipmentText: {
    fontSize: 11,
    color: WorkoutTheme.text.secondary,
    fontWeight: "500",
  },
  emptyText: {
    color: WorkoutTheme.text.tertiary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: WorkoutTheme.accent.purple,
    borderRadius: 8,
  },
  retryButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
});
