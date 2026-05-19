import { getItem } from "@/core/services/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Modal,
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
  PlannedWorkout,
  Programme,
} from "@/services/workout.service";

function getGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

export default function ExploreScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("there");
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<PlannedWorkout | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [workouts, progs] = await Promise.all([
        WorkoutService.getPlanned(),
        WorkoutService.getProgrammes(),
      ]);
      setPlannedWorkouts(workouts);
      setProgrammes(progs);
    } catch {
      setPlannedWorkouts([]);
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getItem("user_name").then((name) => {
      if (name) setUserName(name);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function getFormattedDate(): string {
    const now = new Date();
    return `${t.days[(now.getDay() + 6) % 7]} ${now.getDate()} ${t.months[now.getMonth()].slice(0, 3)}`;
  }

  function openWorkoutModal(workout: PlannedWorkout) {
    setSelectedWorkout(workout);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setSelectedWorkout(null);
  }

  function handleUseWorkout() {
    if (!selectedWorkout) return;
    closeModal();
    router.push({
      pathname: "/(tabs)/explore/workout-detail",
      params: {
        id: selectedWorkout.id,
        title: selectedWorkout.title,
        description: selectedWorkout.description ?? "",
      },
    });
  }

  const difficultyLabel = (d: string) => {
    if (d === "BEGINNER") return t.beginner;
    if (d === "INTERMEDIATE") return t.intermediate;
    return t.advance;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header greeting */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.helloText}>
              {t.hello} {userName},
            </Text>
            <Text style={styles.greetingText}>{t[getGreetingKey()]} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/(tabs)/explore/create-workout")}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator color="#7B5CF0" size="large" style={{ marginTop: 60 }} />
        )}

        {!loading && (
          <>
            {/* My Workouts */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.workoutCategories}</Text>
              <Text style={styles.dateText}>{getFormattedDate()}</Text>
            </View>

            {plannedWorkouts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="barbell-outline" size={40} color="#333" />
                <Text style={styles.emptyText}>{t.noWorkoutsYet}</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {plannedWorkouts.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.workoutCard}
                    activeOpacity={0.85}
                    onPress={() => openWorkoutModal(w)}
                  >
                    <View style={styles.workoutCardIcon}>
                      <Ionicons name="barbell" size={28} color="#7B5CF0" />
                    </View>
                    <Text style={styles.workoutCardTitle} numberOfLines={2}>
                      {w.title}
                    </Text>
                    <Text style={styles.workoutCardSub}>
                      {w.totalExercises} exercices
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Programmes */}
            {programmes.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t.newWorkouts}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {programmes.map((p) => (
                    <View key={p.id} style={styles.programmeCard}>
                      <View style={styles.programmeBadge}>
                        <Text style={styles.programmeBadgeText}>
                          {difficultyLabel(p.difficulty)}
                        </Text>
                      </View>
                      <Text style={styles.programmeTitle} numberOfLines={2}>
                        {p.title}
                      </Text>
                      <Text style={styles.programmeSub}>
                        Week {p.weekNumber}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Workout Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedWorkout && (
              <View style={styles.modalBody}>
                <View style={styles.modalIcon}>
                  <Ionicons name="barbell" size={36} color="#7B5CF0" />
                </View>
                <Text style={styles.modalWorkoutTitle}>
                  {selectedWorkout.title}
                </Text>
                {selectedWorkout.description ? (
                  <Text style={styles.modalDescription}>
                    {selectedWorkout.description}
                  </Text>
                ) : null}
                <Text style={styles.modalMeta}>
                  {selectedWorkout.totalExercises} exercices
                </Text>
                <TouchableOpacity
                  style={styles.useButton}
                  onPress={handleUseWorkout}
                >
                  <Text style={styles.useButtonText}>{t.useIt}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.cancelLink}
                >
                  <Text style={styles.cancelText}>{t.cancel2}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7B5CF0",
    alignItems: "center",
    justifyContent: "center",
  },
  helloText: { fontSize: 22, fontWeight: "bold", color: "#ffffff" },
  greetingText: { fontSize: 15, color: "#aaaaaa", marginTop: 2 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#ffffff" },
  dateText: { fontSize: 13, color: "#7B5CF0", fontWeight: "600" },

  horizontalScroll: { paddingHorizontal: 16, paddingBottom: 4 },

  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  emptyText: { color: "#555", fontSize: 15 },

  workoutCard: {
    width: 180,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    gap: 8,
  },
  workoutCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  workoutCardTitle: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },
  workoutCardSub: { color: "#888", fontSize: 12 },

  programmeCard: {
    width: 160,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    gap: 8,
  },
  programmeBadge: {
    backgroundColor: "#7B5CF022",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  programmeBadgeText: { color: "#7B5CF0", fontSize: 11, fontWeight: "600" },
  programmeTitle: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },
  programmeSub: { color: "#888", fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalBody: { padding: 24, alignItems: "center" },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalWorkoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 14,
    color: "#aaaaaa",
    textAlign: "center",
    marginBottom: 12,
  },
  modalMeta: { fontSize: 13, color: "#7B5CF0", marginBottom: 20 },
  useButton: {
    backgroundColor: "#7B5CF0",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  useButtonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
  cancelLink: { paddingVertical: 8, marginBottom: 8 },
  cancelText: { color: "#888888", fontSize: 14 },
});
