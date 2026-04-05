import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import ExerciseSelector, {
  Exercise,
} from "@/components/workout/ExerciseSelector";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/ExerciseSetupItem";

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<
    ExerciseSetupData[]
  >([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("45");
  const [loading, setLoading] = useState(true);

  // Charge les données du workout au montage
  useEffect(() => {
    loadWorkoutData();
  }, [id]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par un appel API
      // const workout = await api.get(`/workouts/${id}`);

      // Données temporaires pour la démo
      if (id === "1") {
        setName("Upper Body Strength");
        setDescription("Entraînement complet du haut du corps");
        setImage(
          "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
        );
        setEstimatedTime("90");
        setSelectedExercises([
          { id: "e1", name: "Bench Press", sets: 4, reps: 6, weight: 100 },
          { id: "e2", name: "Pull-ups", sets: 3, reps: 8, weight: 0 },
          { id: "e3", name: "Shoulder Press", sets: 3, reps: 8, weight: 60 },
        ]);
      } else if (id === "2") {
        setName("Leg Day Power");
        setDescription("Jambes explosives");
        setImage(
          "https://images.unsplash.com/photo-1434608519344-49d77a124f62?w=800&q=80",
        );
        setEstimatedTime("120");
        setSelectedExercises([
          { id: "e4", name: "Squats", sets: 5, reps: 5, weight: 150 },
          { id: "e5", name: "leg Press", sets: 4, reps: 8, weight: 200 },
          { id: "e6", name: "Leg Curls", sets: 3, reps: 12, weight: 80 },
          { id: "e7", name: "Calf Raises", sets: 3, reps: 15, weight: 100 },
        ]);
      }
    } catch (error) {
      console.error("Erreur loading workout:", error);
      Alert.alert("Erreur", "Impossible de charger la séance");
    } finally {
      setLoading(false);
    }
  };

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

  const handleRemoveExercise = (exId: string) => {
    setSelectedExercises(selectedExercises.filter((ex) => ex.id !== exId));
  };

  const calculateTotalWeight = () => {
    return selectedExercises.reduce((total, ex) => {
      return total + ex.weight * ex.sets * ex.reps;
    }, 0);
  };

  const updateWorkout = async () => {
    if (!name.trim()) {
      alert("Veuillez entrer un nom de séance");
      return;
    }

    if (selectedExercises.length === 0) {
      alert("Veuillez ajouter au moins un exercice");
      return;
    }

    try {
      const workout = {
        name,
        description,
        image,
        exercises: selectedExercises,
        estimatedTime: parseInt(estimatedTime) || 45,
        updatedAt: new Date().toISOString(),
      };

      console.log("Workout updated:", workout);
      // TODO: Appel API pour mettre à jour

      alert("Séance mise à jour avec succès!");
      router.back();
    } catch (error) {
      alert(
        `Erreur: ${error instanceof Error ? error.message : "Erreur serveur"}`,
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons
            name="hourglass"
            size={40}
            color={WorkoutTheme.accent.purple}
          />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View>
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

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={updateWorkout} style={styles.updateButton}>
            <Ionicons
              name="checkmark-done"
              size={20}
              color={WorkoutTheme.text.primary}
            />
            <Text style={styles.updateButtonText}>Mettre à jour</Text>
          </TouchableOpacity>
        </View>

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
    marginBottom: 100,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: WorkoutTheme.text.secondary,
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
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  cancelButtonText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 16,
    fontWeight: "700",
  },
  updateButton: {
    flex: 1,
    backgroundColor: WorkoutTheme.accent.purple,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  updateButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
