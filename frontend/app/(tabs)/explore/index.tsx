import { getItem } from "@/core/services/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { ProgrammeService } from "@/services/programme.service";
import { WorkoutService, CompletedWorkout } from "@/services/workout.service";
import { Ionicons } from "@expo/vector-icons";

function getGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

type Programme = {
  id: string;
  title: string;
  description?: string;
  workouts: any[];
};

export default function ExploreScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("there");
  const [loading, setLoading] = useState(true);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<CompletedWorkout[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getItem("user_name").then((name) => {
      if (name) setUserName(name);
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [programmesData, workoutsData] = await Promise.all([
        ProgrammeService.getAll().catch(() => []),
        WorkoutService.getCompleted().catch(() => []),
      ]);
      setProgrammes(programmesData);
      setRecentWorkouts(workoutsData.slice(0, 3));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getFormattedDate(): string {
    const now = new Date();
    return `${t.days[(now.getDay() + 6) % 7]} ${now.getDate()} ${t.months[now.getMonth()].slice(0, 3)}`;
  }

  function openProgrammeModal(programme: Programme) {
    setSelectedProgramme(programme);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setSelectedProgramme(null);
  }

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
          <View>
            <Text style={styles.helloText}>
              {t.hello} {userName},
            </Text>
            <Text style={styles.greetingText}>{t[getGreetingKey()]}</Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.todaysCommunityFavorite}</Text>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#7B5CF0" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Programmes */}
            {programmes.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t.workoutCategories}</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {programmes.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.programmeCard}
                      activeOpacity={0.85}
                      onPress={() => openProgrammeModal(p)}
                    >
                      <View style={styles.programmeIconWrap}>
                        <Ionicons name="barbell-outline" size={28} color="#7B5CF0" />
                      </View>
                      <Text style={styles.programmeTitle} numberOfLines={2}>
                        {p.title}
                      </Text>
                      <Text style={styles.programmeSub}>
                        {p.workouts?.length ?? 0} workouts
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="barbell-outline" size={40} color="#444" />
                <Text style={styles.emptyText}>Aucun programme disponible</Text>
                <Text style={styles.emptySubText}>Créez votre premier programme pour commencer</Text>
              </View>
            )}

            {/* Recent completed workouts */}
            {recentWorkouts.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>{t.newWorkouts}</Text>
                </View>

                {recentWorkouts.map((w) => (
                  <View key={w.id} style={styles.recentCard}>
                    <View style={styles.recentIconWrap}>
                      <Ionicons name="checkmark-circle" size={24} color="#34D399" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentTitle}>{w.title}</Text>
                      <Text style={styles.recentSub}>
                        {Math.round(w.totalDurationSeconds / 60)} min
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Programme Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedProgramme && (
              <View style={styles.modalBody}>
                <Text style={styles.modalWorkoutTitle}>
                  {selectedProgramme.title}
                </Text>
                {selectedProgramme.description && (
                  <Text style={styles.modalDescription}>
                    {selectedProgramme.description}
                  </Text>
                )}
                <Text style={styles.modalCategory}>
                  {selectedProgramme.workouts?.length ?? 0} workouts
                </Text>
                <TouchableOpacity
                  style={styles.useButton}
                  onPress={closeModal}
                >
                  <Text style={styles.useButtonText}>OK</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  helloText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  greetingText: {
    fontSize: 15,
    color: "#aaaaaa",
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  dateText: {
    fontSize: 13,
    color: "#7B5CF0",
    fontWeight: "600",
  },

  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  programmeCard: {
    width: 180,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  programmeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  programmeTitle: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  programmeSub: {
    color: "#888",
    fontSize: 12,
  },

  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { color: "#888", fontSize: 16, fontWeight: "600" },
  emptySubText: { color: "#555", fontSize: 13, textAlign: "center" },

  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  recentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a2f1a",
    alignItems: "center",
    justifyContent: "center",
  },
  recentTitle: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  recentSub: { color: "#888", fontSize: 12 },

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
  modalBody: {
    padding: 20,
    alignItems: "center",
  },
  modalWorkoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 6,
  },
  modalCategory: {
    fontSize: 14,
    color: "#7B5CF0",
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: "#aaaaaa",
    textAlign: "center",
    marginBottom: 12,
  },
  useButton: {
    backgroundColor: "#7B5CF0",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  useButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelLink: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  cancelText: {
    color: "#888888",
    fontSize: 14,
  },
});
