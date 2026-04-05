import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import WorkoutCard, {
  WorkoutCardData,
  WorkoutExercise,
  WorkoutStats,
} from "@/components/workout/WorkoutCard";

export default function WorkoutScreen() {
  // Sample data - replace with API call later
  const [workouts, setWorkouts] = useState<WorkoutCardData[]>([
    {
      id: "1",
      name: "Upper Body Strength",
      image_url:
        "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
      exercises: [
        {
          id: "e1",
          name: "Bench Press",
          sets: 4,
          reps: 6,
          weight: 100,
          unit: "kg",
        },
        {
          id: "e2",
          name: "Pull-ups",
          sets: 3,
          reps: 8,
          weight: 0,
          unit: "kg",
        },
        {
          id: "e3",
          name: "Shoulder Press",
          sets: 3,
          reps: 8,
          weight: 60,
          unit: "kg",
        },
      ],
      stats: {
        estimatedTime: 90,
        totalWeight: 2280,
        estimatedCalories: 450,
        muscleGroups: ["Poitrine", "Dos", "Épaules", "Triceps", "Biceps"],
        totalSets: 10,
      },
    },
    {
      id: "2",
      name: "Leg Day Power",
      image_url:
        "https://images.unsplash.com/photo-1434608519344-49d77a124f62?w=800&q=80",
      exercises: [
        {
          id: "e4",
          name: "Squats",
          sets: 5,
          reps: 5,
          weight: 150,
          unit: "kg",
        },
        {
          id: "e5",
          name: "leg Press",
          sets: 4,
          reps: 8,
          weight: 200,
          unit: "kg",
        },
        {
          id: "e6",
          name: "Leg Curls",
          sets: 3,
          reps: 12,
          weight: 80,
          unit: "kg",
        },
        {
          id: "e7",
          name: "Calf Raises",
          sets: 3,
          reps: 15,
          weight: 100,
          unit: "kg",
        },
      ],
      stats: {
        estimatedTime: 120,
        totalWeight: 4800,
        estimatedCalories: 600,
        muscleGroups: ["Jambes", "Fessiers", "Quadriceps", "Ischio-jambiers"],
        totalSets: 15,
      },
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  const goToCreateWorkout = () => {
    router.push("/workouts/create");
  };

  const handleEditWorkout = (id: string) => {
    router.push(`/workouts/${id}/edit`);
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts(workouts.filter((w) => w.id !== id));
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
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
        {workouts.length > 0 ? (
          <View style={styles.workoutsContainer}>
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onEdit={() => handleEditWorkout(workout.id)}
                onDelete={() => handleDeleteWorkout(workout.id)}
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
    backgroundColor: WorkoutTheme.background,
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
