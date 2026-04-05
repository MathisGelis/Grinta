import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

export interface WorkoutExercise {
  id: string;
  name: string;
  weight?: number;
  reps?: number;
  sets?: number;
  unit?: string;
}

export interface WorkoutStats {
  estimatedTime: number; // in minutes
  totalWeight: number; // in kg
  estimatedCalories: number;
  muscleGroups: string[];
  totalSets: number;
}

export interface WorkoutCardData {
  id: string;
  name: string;
  image_url?: string;
  exercises: WorkoutExercise[];
  stats: WorkoutStats;
}

interface WorkoutCardProps {
  workout: WorkoutCardData;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}

export default function WorkoutCard({
  workout,
  onEdit,
  onDelete,
  onPress,
}: WorkoutCardProps) {
  const [expandedMenu, setExpandedMenu] = useState<
    "exercises" | "stats" | null
  >(null);
  const [showOptions, setShowOptions] = useState(false);

  const handleMenuPress = (menu: "exercises" | "stats") => {
    if (expandedMenu === menu) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(menu);
    }
  };

  return (
    <View style={[styles.container, { marginBottom: 16 }]}>
      <View style={styles.card}>
        {/* Image Background */}
        <ImageBackground
          source={
            workout.image_url
              ? { uri: workout.image_url }
              : require("@/assets/onboarding1.jpg")
          }
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Dark overlay */}
          <View style={styles.darkOverlay} />

          {/* Header info */}
          <View style={styles.headerContent}>
            <Text style={styles.workoutName}>{workout.name}</Text>
          </View>

          {/* Bottom bar with stats */}
          <View style={styles.bottomBar}>
            <View style={styles.statsContainer}>
              <View style={styles.statBadge}>
                <Ionicons
                  name="flame"
                  size={14}
                  color={WorkoutTheme.status.danger}
                />
                <Text style={styles.statBadgeText}>
                  {workout.stats.estimatedCalories} kcal
                </Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons
                  name="time"
                  size={14}
                  color={WorkoutTheme.status.info}
                />
                <Text style={styles.statBadgeText}>
                  {workout.stats.estimatedTime}m
                </Text>
              </View>
            </View>

            {/* Menu toggle button */}
            <TouchableOpacity
              onPress={() => setShowOptions(!showOptions)}
              style={styles.menuButton}
            >
              <Ionicons
                name={showOptions ? "close" : "ellipsis-vertical"}
                size={18}
                color={WorkoutTheme.accent.purple}
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Options menu */}
        {showOptions && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                handleMenuPress("exercises");
                setShowOptions(false);
              }}
            >
              <Ionicons
                name="barbell"
                size={16}
                color={WorkoutTheme.accent.purple}
              />
              <Text style={styles.optionText}>Exercices</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                handleMenuPress("stats");
                setShowOptions(false);
              }}
            >
              <Ionicons
                name="stats-chart"
                size={16}
                color={WorkoutTheme.accent.purple}
              />
              <Text style={styles.optionText}>Statistiques</Text>
            </TouchableOpacity>
            {onEdit && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onEdit();
                  setShowOptions(false);
                }}
              >
                <Ionicons
                  name="pencil"
                  size={16}
                  color={WorkoutTheme.status.info}
                />
                <Text style={styles.optionText}>Modifier</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onDelete();
                  setShowOptions(false);
                }}
              >
                <Ionicons
                  name="trash"
                  size={16}
                  color={WorkoutTheme.status.danger}
                />
                <Text
                  style={[
                    styles.optionText,
                    { color: WorkoutTheme.status.danger },
                  ]}
                >
                  Supprimer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Expanded menu - Exercises */}
        {expandedMenu === "exercises" && (
          <View style={styles.expandedMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Exercices</Text>
              <TouchableOpacity onPress={() => setExpandedMenu(null)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={WorkoutTheme.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {workout.exercises.length > 0 ? (
              <View>
                {workout.exercises.map((exercise, index) => (
                  <View
                    key={exercise.id}
                    style={[
                      styles.exerciseItem,
                      index !== workout.exercises.length - 1 &&
                        styles.exerciseItemBorder,
                    ]}
                  >
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseDetails}>
                        {exercise.sets && (
                          <Text style={styles.exerciseDetail}>
                            {exercise.sets} séries
                          </Text>
                        )}
                        {exercise.reps && (
                          <Text style={styles.exerciseDetail}>
                            {exercise.reps} reps
                          </Text>
                        )}
                        {exercise.weight && (
                          <Text style={styles.exerciseDetail}>
                            {exercise.weight} {exercise.unit || "kg"}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={WorkoutTheme.text.tertiary}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Aucun exercice</Text>
            )}
          </View>
        )}

        {/* Expanded menu - Stats */}
        {expandedMenu === "stats" && (
          <View style={styles.expandedMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Statistiques</Text>
              <TouchableOpacity onPress={() => setExpandedMenu(null)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={WorkoutTheme.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Ionicons
                  name="time"
                  size={24}
                  color={WorkoutTheme.accent.purple}
                />
                <Text style={styles.statValue}>
                  {workout.stats.estimatedTime}m
                </Text>
                <Text style={styles.statLabel}>Durée</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons
                  name="flame"
                  size={24}
                  color={WorkoutTheme.status.danger}
                />
                <Text style={styles.statValue}>
                  {workout.stats.estimatedCalories}
                </Text>
                <Text style={styles.statLabel}>kcal</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons
                  name="barbell"
                  size={24}
                  color={WorkoutTheme.status.success}
                />
                <Text style={styles.statValue}>
                  {workout.stats.totalWeight}kg
                </Text>
                <Text style={styles.statLabel}>Poids</Text>
              </View>
              <View style={styles.statBox}>
                <Ionicons
                  name="repeat"
                  size={24}
                  color={WorkoutTheme.status.info}
                />
                <Text style={styles.statValue}>{workout.stats.totalSets}</Text>
                <Text style={styles.statLabel}>Séries</Text>
              </View>
            </View>

            {workout.stats.muscleGroups.length > 0 && (
              <View style={styles.muscleGroupsContainer}>
                <Text style={styles.muscleGroupsTitle}>Muscles travaillés</Text>
                <View style={styles.muscleGroupsWrap}>
                  {workout.stats.muscleGroups.map((muscle, index) => (
                    <View key={index} style={styles.muscleGroup}>
                      <Text style={styles.muscleGroupText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: WorkoutTheme.backgroundTertiary,
  },
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
  },
  workoutName: {
    fontSize: 18,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
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
  optionsMenu: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: WorkoutTheme.border,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  optionText: {
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  expandedMenu: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: WorkoutTheme.border,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: WorkoutTheme.text.primary,
  },
  exerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  exerciseItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: WorkoutTheme.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    color: WorkoutTheme.text.primary,
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: "row",
    gap: 12,
  },
  exerciseDetail: {
    fontSize: 12,
    color: WorkoutTheme.text.secondary,
  },
  emptyText: {
    color: WorkoutTheme.text.tertiary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: WorkoutTheme.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: WorkoutTheme.accent.purple,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: WorkoutTheme.text.secondary,
    marginTop: 4,
  },
  muscleGroupsContainer: {
    marginTop: 12,
  },
  muscleGroupsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
    marginBottom: 8,
  },
  muscleGroupsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  muscleGroup: {
    backgroundColor: WorkoutTheme.accent.purpleDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  muscleGroupText: {
    fontSize: 11,
    color: WorkoutTheme.accent.purpleLight,
    fontWeight: "500",
  },
});
