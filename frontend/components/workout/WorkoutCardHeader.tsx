import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

interface WorkoutCardHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  totalExercises?: number;
  stats: {
    totalSets: number;
    totalWeight: number;
  };
  hasWorkout?: boolean;
}

export default function WorkoutCardHeader({
  title,
  isExpanded,
  onToggleExpand,
  totalExercises,
  stats,
  hasWorkout,
}: WorkoutCardHeaderProps) {
  return (
    <ImageBackground
      source={require("@/assets/onboarding1.jpg")}
      style={styles.imageBackground}
      resizeMode="cover"
    >
      {/* Dark overlay */}
      <View style={styles.darkOverlay} />

      {/* Header info */}
      <View style={styles.headerContent}>
        <Text style={styles.workoutName} numberOfLines={2}>
          {title}
        </Text>
      </View>

      {/* Bottom bar with stats */}
      <View style={styles.bottomBar}>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Ionicons
              name="repeat"
              size={14}
              color={WorkoutTheme.accent.purple}
            />
            <Text style={styles.statBadgeText}>{stats.totalSets} séries</Text>
          </View>
          {hasWorkout && (
            <View style={styles.statBadge}>
              <Ionicons
                name="barbell"
                size={14}
                color={WorkoutTheme.status.success}
              />
              <Text style={styles.statBadgeText}>{stats.totalWeight} kg</Text>
            </View>
          )}
          {totalExercises && totalExercises > 0 && (
            <View style={styles.statBadge}>
              <Ionicons
                name="fitness"
                size={14}
                color={WorkoutTheme.status.info}
              />
              <Text style={styles.statBadgeText}>
                {totalExercises} exercices
              </Text>
            </View>
          )}
        </View>

        {/* Menu toggle button */}
        <TouchableOpacity onPress={onToggleExpand} style={styles.menuButton}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={WorkoutTheme.accent.purple}
          />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  imageBackground: {
    height: 200,
    justifyContent: "space-between",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flex: 1,
    justifyContent: "flex-start",
  },
  workoutName: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statBadgeText: {
    color: WorkoutTheme.text.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  menuButton: {
    padding: 8,
  },
});
