import React, { useState, useMemo } from "react";
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

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipmentType: "machine" | "cable" | "freeweight" | "bodyweight" | "barbell";
  description?: string;
}

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

// Sample exercises database
const SAMPLE_EXERCISES: Exercise[] = [
  {
    id: "e1",
    name: "Bench Press",
    muscleGroups: ["Poitrine", "Triceps", "Épaules"],
    equipmentType: "barbell",
  },
  {
    id: "e2",
    name: "Squats",
    muscleGroups: ["Jambes", "Fessiers", "Dos"],
    equipmentType: "barbell",
  },
  {
    id: "e3",
    name: "Pull-ups",
    muscleGroups: ["Dos", "Biceps"],
    equipmentType: "bodyweight",
  },
  {
    id: "e4",
    name: "Lat Pulldown",
    muscleGroups: ["Dos", "Biceps"],
    equipmentType: "machine",
  },
  {
    id: "e5",
    name: "Dumbbell Curls",
    muscleGroups: ["Biceps"],
    equipmentType: "freeweight",
  },
  {
    id: "e6",
    name: "Cable Crosses",
    muscleGroups: ["Poitrine"],
    equipmentType: "cable",
  },
  {
    id: "e7",
    name: "Leg Press",
    muscleGroups: ["Jambes", "Fessiers"],
    equipmentType: "machine",
  },
  {
    id: "e8",
    name: "Shoulder Press",
    muscleGroups: ["Épaules", "Triceps"],
    equipmentType: "barbell",
  },
  {
    id: "e9",
    name: "Rows",
    muscleGroups: ["Dos", "Biceps"],
    equipmentType: "barbell",
  },
  {
    id: "e10",
    name: "Planks",
    muscleGroups: ["Abdominaux", "Dos"],
    equipmentType: "bodyweight",
  },
];

const MUSCLE_GROUPS = [
  "Poitrine",
  "Dos",
  "Jambes",
  "Épaules",
  "Biceps",
  "Triceps",
  "Abdominaux",
  "Fessiers",
];

const EQUIPMENT_TYPES = [
  { id: "machine", label: "Machine", icon: "checkbox-outline" },
  { id: "cable", label: "Poulie", icon: "swap-horizontal" },
  { id: "freeweight", label: "Poids libre", icon: "water" },
  { id: "bodyweight", label: "Poids du corps", icon: "person" },
  { id: "barbell", label: "Barre", icon: "barbell-outline" },
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
    return SAMPLE_EXERCISES.filter((exercise) => {
      // Search filter
      const matchesSearch = exercise.name
        .toLowerCase()
        .includes(searchText.toLowerCase());

      // Muscle filter
      const matchesMuscle =
        selectedMuscles.length === 0 ||
        selectedMuscles.some((muscle) =>
          exercise.muscleGroups.includes(muscle),
        );

      // Equipment filter
      const matchesEquipment =
        selectedEquipment.length === 0 ||
        selectedEquipment.includes(exercise.equipmentType);

      return matchesSearch && matchesMuscle && matchesEquipment;
    });
  }, [searchText, selectedMuscles, selectedEquipment]);

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
          {/* Muscle Groups Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Muscles</Text>
            <View style={styles.filterWrap}>
              {MUSCLE_GROUPS.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={[
                    styles.filterPill,
                    selectedMuscles.includes(muscle) && styles.filterPillActive,
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
                  <Ionicons
                    name={equipment.icon as any}
                    size={14}
                    color={
                      selectedEquipment.includes(equipment.id)
                        ? WorkoutTheme.text.primary
                        : WorkoutTheme.text.secondary
                    }
                  />
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
                      {exercise.muscleGroups.map((muscle) => (
                        <View key={muscle} style={styles.muscleTag}>
                          <Text style={styles.muscleTagText}>{muscle}</Text>
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
                        {exercise.equipmentType}
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
});
