import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "@/contexts/LanguageContext";
import { WorkoutService, CompletedWorkout } from "@/services/workout.service";

function getWeekDates(weekOffset: number) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function StatsScreen() {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(weekOffset);
  const displayMonth = weekDates[0];
  const monthLabel = `${t.months[displayMonth.getMonth()]} ${displayMonth.getFullYear()}`;

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await WorkoutService.getCompleted();
      setWorkouts(data);
    } catch {
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const handleDeleteWorkout = (workout: CompletedWorkout) => {
    Alert.alert(
      t.delete || "Delete",
      `${t.deleteWorkoutConfirm || "Delete"} "${workout.title}" ?`,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await WorkoutService.deleteCompleted(workout.id);
              setWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
            } catch {}
          },
        },
      ]
    );
  };

  const totalWorkouts = workouts.length;
  const totalDurationSec = workouts.reduce((s, w) => s + (w.totalDurationSeconds || 0), 0);
  const totalDurationLabel = totalDurationSec > 0 ? formatDuration(totalDurationSec) : "0 min";

  const formatWorkoutDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${t.days[(d.getDay() + 6) % 7]}, ${t.months[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.statistics}</Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => setWeekOffset((w) => w - 1)}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => setWeekOffset((w) => w + 1)}>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.daysRow}>
            {t.days.map((day, i) => {
              const date = weekDates[i];
              const isToday = weekOffset === 0 && i === getTodayIndex();
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayPill,
                    selectedDay === i && styles.dayPillActive,
                    isToday && selectedDay !== i && styles.dayPillToday,
                  ]}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayText, selectedDay === i && styles.dayTextActive]}>
                    {day}
                  </Text>
                  <Text style={[styles.dayNum, selectedDay === i && styles.dayTextActive]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary stats */}
        <View style={styles.smallRingsRow}>
          <View style={styles.smallRingItem}>
            <View style={[styles.ringOuter, { borderColor: "#7B5CF0" }]}>
              <Text style={styles.ringValue}>{totalWorkouts}</Text>
            </View>
            <Text style={styles.ringLabel}>{t.workoutsLabel}</Text>
          </View>
          <View style={styles.smallRingItem}>
            <View style={[styles.ringOuter, { borderColor: "#34D399" }]}>
              <Text style={styles.ringValue}>{totalDurationLabel}</Text>
            </View>
            <Text style={styles.ringLabel}>{t.active}</Text>
          </View>
        </View>

        {/* Completed Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.finishedWorkout}</Text>
          {loading && (
            <ActivityIndicator color="#7B5CF0" style={{ marginTop: 24 }} />
          )}
          {!loading && workouts.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>{t.noWorkoutsYet || "No workouts yet"}</Text>
            </View>
          )}
          {!loading &&
            workouts.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={styles.workoutCard}
                activeOpacity={0.7}
                onLongPress={() => handleDeleteWorkout(w)}
              >
                <View style={styles.checkBox}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutName}>{w.title}</Text>
                  <Text style={styles.workoutMeta}>
                    {formatWorkoutDate(w.completionDate)} · {formatDuration(w.totalDurationSeconds)}
                  </Text>
                </View>
                <Text style={styles.workoutExercises}>
                  {w.totalExercises} ex.
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "700" },

  calendarCard: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  monthLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  daysRow: { flexDirection: "row", justifyContent: "space-between" },
  dayPill: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 20,
    minWidth: 36,
  },
  dayPillActive: { backgroundColor: "#7B5CF0" },
  dayPillToday: { borderWidth: 1, borderColor: "#7B5CF055" },
  dayText: { color: "#666", fontSize: 10, marginBottom: 4 },
  dayNum: { color: "#666", fontSize: 13, fontWeight: "600" },
  dayTextActive: { color: "#fff" },

  smallRingsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  smallRingItem: { alignItems: "center", gap: 8 },
  ringOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  ringLabel: { color: "#888", fontSize: 12 },

  section: { paddingHorizontal: 16 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  workoutCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#7B5CF0",
    alignItems: "center",
    justifyContent: "center",
  },
  workoutName: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  workoutMeta: { color: "#666", fontSize: 12 },
  workoutExercises: { color: "#7B5CF0", fontSize: 14, fontWeight: "600" },

  empty: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: "#555", fontSize: 16 },
});
