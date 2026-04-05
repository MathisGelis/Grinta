import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const EXERCISES = [
  {
    name: "Simple Warm-Up Exercises",
    duration: "0:30",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
  },
  {
    name: "Stability Training Basics",
    duration: "1:00",
    image:
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80",
  },
  {
    name: "Core Plank Series",
    duration: "0:45",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80",
  },
];

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    category: string;
    image: string;
    duration: string;
    calories: string;
    description: string;
  }>();

  const title = params.title || "Emma's Core Challenge";
  const category = params.category || "Intermediate";
  const image =
    params.image ||
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80";
  const duration = params.duration || "60 min";
  const calories = params.calories || "350";
  const description =
    params.description ||
    "Want your body to be healthy. Join our program with directions according to body's goals.";

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Hero image */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: image }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Back button */}
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
        {/* Title & category */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.category}>Workouts · {category}</Text>

        {/* Stats pills */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>▶ {duration}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillText}>🔥 {calories} Cal</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>

        {/* Exercise list */}
        <Text style={styles.exercisesTitle}>Exercises</Text>
        {EXERCISES.map((ex, idx) => (
          <View key={idx} style={styles.exerciseCard}>
            <Image
              source={{ uri: ex.image }}
              style={styles.exerciseThumbnail}
              resizeMode="cover"
            />
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseDuration}>{ex.duration}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}

        {/* Spacer so content clears the fixed button */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Start Workout button — fixed at bottom */}
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
    height: SCREEN_HEIGHT * 0.45,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
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
    padding: 10,
    marginBottom: 10,
  },
  exerciseThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
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
