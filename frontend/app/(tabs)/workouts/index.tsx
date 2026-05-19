import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import WorkoutCard from "@/components/workout/WorkoutCard";
import {
  getPlannedWorkouts,
  PlannedWorkout,
  deletePlannedWorkout,
  fullPlannedWorkout,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge les workouts plannifiés
   */
  const loadWorkouts = useCallback(async () => {
    try {
      setError(null);
      const token = await TokenService.get();
      const plannedWorkouts = await getPlannedWorkouts(token || undefined);
      setWorkouts(plannedWorkouts);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge les workouts au montage du composant
   */
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWorkouts();
    }, [loadWorkouts]),
  );

  const goToCreateWorkout = () => {
    router.push("/workouts/create");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkouts().finally(() => setRefreshing(false));
  }, [loadWorkouts]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes séances</Text>
          <Text style={styles.headerSubtitle}>
            {workouts.length} séance{workouts.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={goToCreateWorkout}
          style={styles.createButton}
        >
          <Ionicons name="add" size={24} color={WorkoutTheme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Workouts List */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={WorkoutTheme.text.primary} />
            <Text style={styles.loadingText}>Chargement des séances...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons
              name="alert-circle"
              size={60}
              color={WorkoutTheme.text.tertiary}
            />
            <Text style={styles.errorTitle}>Erreur</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                loadWorkouts();
              }}
              style={styles.emptyStateButton}
            >
              <Ionicons
                name="refresh"
                size={24}
                color={WorkoutTheme.text.primary}
              />
              <Text style={styles.emptyStateButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : workouts.length > 0 ? (
          <View style={styles.workoutsContainer}>
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onDelete={async () => {
                  try {
                    const token = await TokenService.get();
                    await deletePlannedWorkout(workout.id, token || undefined);
                    // Supprimer du state local
                    setWorkouts(workouts.filter((w) => w.id !== workout.id));
                  } catch (err) {
                    const message =
                      err instanceof Error
                        ? err.message
                        : "Erreur lors de la suppression";
                    Alert.alert("Erreur", message);
                    console.error("Erreur de suppression:", err);
                  }
                }}
                onUpdate={(updatedWorkout: fullPlannedWorkout) => {
                  // Mettre à jour le state local avec la séance modifiée
                  // On convertit fullPlannedWorkout en PlannedWorkout
                  const updatedPlanned: PlannedWorkout = {
                    id: updatedWorkout.id,
                    title: updatedWorkout.title,
                    description: updatedWorkout.description,
                    totalExercises: updatedWorkout.totalExercises,
                  };
                  setWorkouts(
                    workouts.map((w) =>
                      w.id === updatedWorkout.id ? updatedPlanned : w,
                    ),
                  );
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="body"
              size={60}
              color={WorkoutTheme.text.tertiary}
            />
            <Text style={styles.emptyStateTitle}>Aucune séance</Text>
            <Text style={styles.emptyStateText}>
              Créez votre première séance d&apos;entraînement
            </Text>
            <TouchableOpacity
              onPress={goToCreateWorkout}
              style={styles.emptyStateButton}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color={WorkoutTheme.text.primary}
              />
              <Text style={styles.emptyStateButtonText}>Créer une séance</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WorkoutTheme.backgroundSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerSubtitle: {
    fontSize: 12,
    color: WorkoutTheme.text.secondary,
    marginTop: 2,
  },
  createButton: {
    backgroundColor: WorkoutTheme.accent.purple,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
    backgroundColor: WorkoutTheme.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: WorkoutTheme.text.secondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: WorkoutTheme.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
  workoutsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statsOverview: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    marginBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: WorkoutTheme.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: WorkoutTheme.accent.purple,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateButtonText: {
    color: WorkoutTheme.text.primary,
    fontWeight: "600",
    fontSize: 14,
  },
});
