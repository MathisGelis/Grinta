import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { TokenService } from "@/services/token.service";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    category: string;
    duration: string;
    calories: string;
    description: string;
  }>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const title = params.title || "Workout";
  const category = params.category || "";
  const duration = params.duration || "";
  const calories = params.calories || "";
  const description = params.description || "";

  useEffect(() => {
    async function fetchExercises() {
      try {
        const token = await TokenService.get();
        const data = await api.get<Exercise[]>("/exercises", token ?? undefined);
        setExercises(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchExercises();
  }, []);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Hero section */}
      <View style={styles.heroContainer}>
        <View style={styles.heroBg}>
          <Ionicons name="barbell" size={64} color="#7B5CF033" />
        </View>
        <SafeAreaView style={styles.backWrapper} edges={["top"]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {/* Content sheet */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        {category ? <Text style={styles.category}>Workouts · {category}</Text> : null}

        {/* Stats pills */}
        {(duration || calories) && (
          <View style={styles.statsRow}>
            {duration ? (
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>▶ {duration}</Text>
              </View>
            ) : null}
            {calories ? (
              <View style={styles.statPill}>
                <Text style={styles.statPillText}>🔥 {calories} Cal</Text>
              </View>
            ) : null}
          </View>
        )}

        {description ? <Text style={styles.description}>{description}</Text> : null}

        {/* Exercise list */}
        <Text style={styles.exercisesTitle}>Exercises</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#7B5CF0" style={{ marginTop: 16 }} />
        ) : exercises.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun exercice disponible</Text>
          </View>
        ) : (
          exercises.map((ex) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <View style={styles.exerciseIcon}>
                <Ionicons name="fitness-outline" size={24} color="#7B5CF0" />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                {ex.muscleGroup && (
                  <Text style={styles.exerciseDuration}>{ex.muscleGroup}</Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          ))
        )}

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
  root: {
    flex: 1,
    backgroundColor: "#121212",
  },

  heroContainer: {
    height: SCREEN_HEIGHT * 0.3,
    position: "relative",
    backgroundColor: "#1a1a1a",
  },
  heroBg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    margin: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 20,
    color: "#121212",
    fontWeight: "bold",
    lineHeight: 22,
  },

  sheet: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  category: {
    fontSize: 14,
    color: "#7B5CF0",
    fontWeight: "600",
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statPill: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statPillText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },

  description: {
    fontSize: 14,
    color: "#aaaaaa",
    lineHeight: 22,
    marginBottom: 24,
  },

  exercisesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },

  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseDuration: {
    color: "#7B5CF0",
    fontSize: 13,
    fontWeight: "500",
  },
  chevron: {
    color: "#888888",
    fontSize: 22,
    paddingLeft: 8,
  },

  emptyCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { color: "#555", fontSize: 14 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
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
  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
