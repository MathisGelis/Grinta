import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import WorkoutCard from "@/components/workout/WorkoutCard";
import {
  getPlannedWorkouts,
  PlannedWorkout,
  fullPlannedWorkout,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import GlassSearchBar from "@/components/GlassSearchBar";

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { keyboardY, bottomOffset } = useKeyboardOffset();

  /**
   * Charge les workouts plannifiés
   */
  const loadWorkouts = useCallback(async () => {
    try {
      setError(null);
      const token = await TokenService.get();
      const plannedWorkouts = await getPlannedWorkouts(token || undefined);
      setWorkouts(plannedWorkouts);
      setFilteredWorkouts(plannedWorkouts);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchResults = (filteredNames: string[]) => {
    const filtered = workouts.filter((w) => filteredNames.includes(w.title));
    setFilteredWorkouts(filtered);
  };

  /**
   * Charge les workouts au montage du composant
   */
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWorkouts();
    }, [loadWorkouts]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkouts().finally(() => setRefreshing(false));
  }, [loadWorkouts]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Workouts List */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: bottomOffset }}
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
            {filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onDelete={() => {
                  setWorkouts((prev) =>
                    prev.filter((w) => w.id !== workout.id),
                  );
                }}
                onUpdate={(updatedWorkout: fullPlannedWorkout) => {
                  const updatedPlanned: PlannedWorkout = {
                    id: updatedWorkout.id,
                    title: updatedWorkout.title,
                    description: updatedWorkout.description,
                    totalExercises: updatedWorkout.totalExercises,
                  };
                  setWorkouts((prev) =>
                    prev.map((w) =>
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
              onPress={() => router.push("/(tabs)/workouts/createWorkout")}
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

      {/* FAB - Floating Action Button */}
      <Animated.View
        className="absolute left-0 right-0 px-4"
        style={{
          bottom: bottomOffset + 8,
          transform: [{ translateY: keyboardY }],
        }}
      >
        <GlassSearchBar
          items={workouts.map((s) => s.title)}
          onResults={handleSearchResults}
          onAdd={() => router.push("/(tabs)/workouts/createWorkout")}
          placeholder="Rechercher une séance…"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WorkoutTheme.background,
    position: "relative",
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
  headerSubtitle: {
    fontSize: 12,
    color: WorkoutTheme.text.secondary,
    marginTop: 2,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: WorkoutTheme.accent.purple,
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },
});
