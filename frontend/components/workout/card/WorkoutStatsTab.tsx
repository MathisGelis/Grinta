import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { fullPlannedWorkout } from "@/services/workouts.service";

interface WorkoutStatsTabProps {
  workout: fullPlannedWorkout | null;
  stats: {
    totalSets: number;
    totalReps: number;
    totalWeight: number;
  };
}

export default function WorkoutStatsTab({
  workout,
  stats,
}: WorkoutStatsTabProps) {
  return (
    <View style={styles.statsContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons
            name="repeat"
            size={24}
            color={WorkoutTheme.accent.purple}
          />
          <Text style={styles.statBoxValue}>{stats.totalSets}</Text>
          <Text style={styles.statBoxLabel}>Séries</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="fitness" size={24} color={WorkoutTheme.status.info} />
          <Text style={styles.statBoxValue}>{stats.totalReps}</Text>
          <Text style={styles.statBoxLabel}>Reps total</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons
            name="barbell"
            size={24}
            color={WorkoutTheme.status.success}
          />
          <Text style={styles.statBoxValue}>{stats.totalWeight}</Text>
          <Text style={styles.statBoxLabel}>kg total</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="list" size={24} color={WorkoutTheme.status.danger} />
          <Text style={styles.statBoxValue}>
            {workout?.exercises?.length || 0}
          </Text>
          <Text style={styles.statBoxLabel}>Exercices</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContent: {
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: WorkoutTheme.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: "700",
    color: WorkoutTheme.accent.purple,
    marginTop: 6,
  },
  statBoxLabel: {
    fontSize: 11,
    color: WorkoutTheme.text.secondary,
    marginTop: 4,
    textAlign: "center",
  },
});
