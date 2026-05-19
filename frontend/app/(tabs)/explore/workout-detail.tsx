import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  WorkoutService,
  PlannedWorkoutDetail,
  WorkoutExercise,
} from "@/services/workout.service";

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    description: string;
  }>();

  const [detail, setDetail] = useState<PlannedWorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    WorkoutService.getPlannedDetail(params.id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const title = detail?.workout.title ?? params.title ?? "Workout";
  const description = detail?.workout.description ?? params.description ?? "";
  const exercises: WorkoutExercise[] = detail?.workout.exercises ?? [];

  const formatSets = (ex: WorkoutExercise): string => {
    if (!ex.sets || ex.sets.length === 0) return "";
    return ex.sets.map((s) => `${s.reps}×${s.weight}kg`).join(" · ");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe} edges={["top"]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="barbell" size={32} color="#7B5CF0" />
          </View>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>
                {exercises.length} exercices
              </Text>
            </View>
          </View>
        </View>

        {/* Exercise list */}
        <Text style={styles.exercisesTitle}>Exercises</Text>

        {loading && (
          <ActivityIndicator color="#7B5CF0" style={{ marginTop: 24 }} />
        )}

        {!loading && exercises.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="fitness-outline" size={40} color="#333" />
            <Text style={styles.emptyText}>No exercises</Text>
          </View>
        )}

        {exercises.map((ex, idx) => (
          <View key={ex.id || idx} style={styles.exerciseCard}>
            <View style={styles.exerciseIndex}>
              <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
              {ex.sets && ex.sets.length > 0 && (
                <Text style={styles.exerciseMeta}>
                  {ex.sets.length} sets · {formatSets(ex)}
                </Text>
              )}
              {ex.exercise.equipment_type && ex.exercise.equipment_type !== "none" && (
                <Text style={styles.exerciseEquip}>
                  {ex.exercise.equipment_type.replace(/_/g, " ")}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Start Workout button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#121212" },

  headerSafe: { backgroundColor: "#121212" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingTop: 8 },

  infoCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "center" },
  description: { fontSize: 14, color: "#aaaaaa", textAlign: "center", lineHeight: 22 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  statPill: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statPillText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },

  exercisesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },

  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  exerciseIndex: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseIndexText: { color: "#7B5CF0", fontSize: 14, fontWeight: "700" },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  exerciseMeta: { color: "#7B5CF0", fontSize: 12, fontWeight: "500" },
  exerciseEquip: { color: "#666", fontSize: 11, marginTop: 2, textTransform: "capitalize" },

  empty: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: "#555", fontSize: 15 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  startButton: {
    backgroundColor: "#7B5CF0",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  startButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
});
