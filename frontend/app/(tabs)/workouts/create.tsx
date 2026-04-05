import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSelector, {
  Exercise,
} from "@/components/workout/ExerciseSelector";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/ExerciseSetupItem";

export default function CreateWorkoutScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseSetupData[]
  >([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("45");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    const newExercise: ExerciseSetupData = {
      id: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: 10,
      weight: 0,
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setShowExerciseSelector(false);
  };

  const handleUpdateExercise = (updated: ExerciseSetupData) => {
    setSelectedExercises(
      selectedExercises.map((ex) => (ex.id === updated.id ? updated : ex)),
    );
  };

  const handleRemoveExercise = (id: string) => {
    setSelectedExercises(selectedExercises.filter((ex) => ex.id !== id));
  };

  const calculateTotalWeight = () => {
    return selectedExercises.reduce((total, ex) => {
      return total + ex.weight * ex.sets * ex.reps;
    }, 0);
  };

  const createWorkout = () => {
    if (!name.trim()) {
      alert("Veuillez entrer un nom de séance");
      return;
    }

    if (selectedExercises.length === 0) {
      alert("Veuillez ajouter au moins un exercice");
      return;
    }

    const workout = {
      name,
      description,
      image,
      exercises: selectedExercises,
      estimatedTime: parseInt(estimatedTime) || 45,
      createdAt: new Date().toISOString(),
    };

    console.log("Workout created:", workout);
    // ➜ appel API / store global plus tard
    alert("Séance créée avec succès!");
    // router.back();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Nom de la séance</Text>
          <View style={styles.inputBox}>
            <Ionicons
              name="barbell"
              size={18}
              color={WorkoutTheme.accent.purple}
            />
            <TextInput
              placeholder="Ex: Push Day"
              placeholderTextColor={WorkoutTheme.text.tertiary}
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Objectif, sensations, notes..."
            placeholderTextColor={WorkoutTheme.text.tertiary}
            multiline
            numberOfLines={4}
            style={[styles.inputBox, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Image */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo</Text>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePickerEmpty}>
                <Ionicons
                  name="image-outline"
                  size={40}
                  color={WorkoutTheme.accent.purple}
                />
                <Text style={styles.imagePickerText}>Ajouter une photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Estimated Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Durée estimée (minutes)</Text>
          <View style={styles.inputBox}>
            <Ionicons
              name="time"
              size={18}
              color={WorkoutTheme.accent.purple}
            />
            <TextInput
              placeholder="Ex: 45"
              placeholderTextColor={WorkoutTheme.text.tertiary}
              style={styles.input}
              value={estimatedTime}
              onChangeText={setEstimatedTime}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.inputSuffix}>min</Text>
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>
              Exercices ({selectedExercises.length})
            </Text>
            <TouchableOpacity
              onPress={() => setShowExerciseSelector(true)}
              style={styles.addButton}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color={WorkoutTheme.accent.purple}
              />
            </TouchableOpacity>
          </View>

          {selectedExercises.length > 0 ? (
            <View>
              {selectedExercises.map((exercise) => (
                <ExerciseSetupItem
                  key={exercise.id}
                  exercise={exercise}
                  onUpdate={handleUpdateExercise}
                  onRemove={() => handleRemoveExercise(exercise.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="barbell"
                size={40}
                color={WorkoutTheme.text.tertiary}
              />
              <Text style={styles.emptyStateText}>Aucun exercice ajouté</Text>
              <Text style={styles.emptyStateSubtext}>
                Appuyez sur le bouton + pour ajouter un exercice
              </Text>
            </View>
          )}
        </View>

        {/* Summary Stats */}
        {selectedExercises.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Statistiques estimées</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons
                  name="barbell"
                  size={20}
                  color={WorkoutTheme.accent.purple}
                />
                <Text style={styles.statValue}>
                  {calculateTotalWeight().toFixed(0)}kg
                </Text>
                <Text style={styles.statLabel}>Poids total</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="repeat"
                  size={20}
                  color={WorkoutTheme.accent.purple}
                />
                <Text style={styles.statValue}>
                  {selectedExercises.reduce((sum, ex) => sum + ex.sets, 0)}
                </Text>
                <Text style={styles.statLabel}>Séries</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="timer"
                  size={20}
                  color={WorkoutTheme.accent.purple}
                />
                <Text style={styles.statValue}>{estimatedTime}m</Text>
                <Text style={styles.statLabel}>Durée</Text>
              </View>
            </View>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity onPress={createWorkout} style={styles.createButton}>
          <Ionicons
            name="checkmark-done"
            size={20}
            color={WorkoutTheme.text.primary}
          />
          <Text style={styles.createButtonText}>Créer la séance</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Exercise Selector Modal */}
      <ExerciseSelector
        isVisible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleSelectExercise}
        selectedExercises={selectedExercises.map((ex) => ex.id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WorkoutTheme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: WorkoutTheme.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    gap: 8,
    height: 48,
  },
  input: {
    flex: 1,
    color: WorkoutTheme.text.primary,
    fontSize: 14,
  },
  inputSuffix: {
    color: WorkoutTheme.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  multilineInput: {
    height: 100,
    paddingVertical: 12,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderWidth: 2,
    borderColor: WorkoutTheme.border,
    borderStyle: "dashed",
    height: 160,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imagePickerEmpty: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePickerText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    padding: 6,
  },
  emptyState: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: WorkoutTheme.text.tertiary,
  },
  statsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: WorkoutTheme.accent.purple,
  },
  statLabel: {
    fontSize: 11,
    color: WorkoutTheme.text.secondary,
  },
  createButton: {
    backgroundColor: WorkoutTheme.accent.purple,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  createButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
