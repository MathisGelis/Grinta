import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";

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

const finishedWorkouts = [
  { id: 1, name: "Full Body Blast", duration: "45 min", calories: 320, daysAgo: 2 },
  { id: 2, name: "Upper Body Push", duration: "38 min", calories: 280, daysAgo: 4 },
  { id: 3, name: "Core & Cardio", duration: "30 min", calories: 210, daysAgo: 6 },
];

export default function StatsScreen() {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());

  const weekDates = getWeekDates(weekOffset);
  const displayMonth = weekDates[0];
  const monthLabel = `${t.months[displayMonth.getMonth()]} ${displayMonth.getFullYear()}`;

  const formatWorkoutDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${t.days[(d.getDay() + 6) % 7]}, ${t.months[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
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
              const isToday =
                weekOffset === 0 && i === getTodayIndex();
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

        {/* Calorie ring */}
        <View style={styles.bigRingSection}>
          <LinearGradient
            colors={["#7B5CF0", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bigRingGradient}
          >
            <View style={styles.bigRingInner}>
              <Text style={styles.bigRingValue}>745</Text>
              <Text style={styles.bigRingLabel}>Cal</Text>
            </View>
          </LinearGradient>
          <Text style={styles.bigRingCaption}>{t.dailyCaloriesBurned}</Text>
        </View>

        {/* 3 stat rings */}
        <View style={styles.smallRingsRow}>
          <View style={styles.smallRingItem}>
            <View style={[styles.ringOuter, { borderColor: "#7B5CF0" }]}>
              <Text style={styles.ringValue}>92%</Text>
            </View>
            <Text style={styles.ringLabel}>{t.wcLabel}</Text>
          </View>
          <View style={styles.smallRingItem}>
            <View style={[styles.ringOuter, { borderColor: "#EC4899" }]}>
              <Text style={styles.ringValue}>105kg</Text>
            </View>
            <Text style={styles.ringLabel}>{t.benchPrLabel}</Text>
          </View>
          <View style={styles.smallRingItem}>
            <View style={[styles.ringOuter, { borderColor: "#34D399" }]}>
              <Text style={styles.ringValue}>5/6</Text>
            </View>
            <Text style={styles.ringLabel}>{t.completedLabel}</Text>
          </View>
        </View>

        {/* Finished Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.finishedWorkout}</Text>
          {finishedWorkouts.map((w) => (
            <View key={w.id} style={styles.workoutCard}>
              <View style={styles.checkBox}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutName}>{w.name}</Text>
                <Text style={styles.workoutMeta}>
                  {formatWorkoutDate(w.daysAgo)} · {w.duration}
                </Text>
              </View>
              <Text style={styles.workoutCal}>{w.calories} cal</Text>
            </View>
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

  bigRingSection: { alignItems: "center", marginBottom: 32 },
  bigRingGradient: {
    width: 180,
    height: 180,
    borderRadius: 90,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bigRingInner: {
    width: "100%",
    height: "100%",
    borderRadius: 90,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  bigRingValue: { color: "#fff", fontSize: 40, fontWeight: "700" },
  bigRingLabel: { color: "#888", fontSize: 16 },
  bigRingCaption: { color: "#555", fontSize: 13 },

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
  workoutCal: { color: "#7B5CF0", fontSize: 14, fontWeight: "600" },
});
