import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import WorkoutCard from "@/components/workoutCreation/WorkoutCard";
import {
  getPlannedWorkouts,
  PlannedWorkout,
  fullPlannedWorkout,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { bottomOffset } = useKeyboardOffset();

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

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWorkouts();
    }, [loadWorkouts]),
  );

  const goToCreateWorkout = () => {
    router.push("/(tabs)/workouts/createWorkout");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkouts().finally(() => setRefreshing(false));
  }, [loadWorkouts]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.myWorkouts}</Text>
          <Text style={styles.headerSubtitle}>
            {workouts.length} {t.sessionCount}{workouts.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={goToCreateWorkout}
          style={styles.createButton}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quick stats */}
      {!loading && !error && workouts.length > 0 && (
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: "#2a1f4a" }]}>
              <Ionicons name="barbell" size={16} color="#7B5CF0" />
            </View>
            <Text style={styles.quickStatValue}>{workouts.length}</Text>
            <Text style={styles.quickStatLabel}>{t.sessions}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: "#1a2f1a" }]}>
              <Ionicons name="fitness" size={16} color="#34D399" />
            </View>
            <Text style={styles.quickStatValue}>
              {workouts.reduce((sum, w) => sum + (w.totalExercises ?? 0), 0)}
            </Text>
            <Text style={styles.quickStatLabel}>{t.exercises}</Text>
          </View>
        </View>
      )}

      {/* Workouts List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomOffset }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7B5CF0"
            colors={["#7B5CF0"]}
          />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <View style={styles.loadingRing}>
              <ActivityIndicator size="large" color="#7B5CF0" />
            </View>
            <Text style={styles.loadingText}>{t.loadingWorkouts}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorIconWrap}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>{t.oops}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                loadWorkouts();
              }}
              style={styles.retryButton}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>{t.retryBtn}</Text>
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
            <View style={styles.emptyIconWrap}>
              <Ionicons name="barbell-outline" size={48} color="#7B5CF0" />
            </View>
            <Text style={styles.emptyStateTitle}>{t.noWorkouts}</Text>
            <Text style={styles.emptyStateText}>
              {t.createFirstWorkout}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/workouts/createWorkout")}
              style={styles.emptyStateButton}
            >
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.emptyStateButtonText}>{t.createWorkout}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  createButton: {
    backgroundColor: "#7B5CF0",
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#7B5CF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  quickStats: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  quickStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  quickStatLabel: {
    color: "#888",
    fontSize: 11,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 4,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  loadingRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#888",
  },

  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7B5CF0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  workoutsContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7B5CF0",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 28,
    shadowColor: "#7B5CF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
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
