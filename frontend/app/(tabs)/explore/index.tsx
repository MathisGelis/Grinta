import { getItem } from "@/core/services/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useMemo } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WorkoutTheme } from "@/constants/Colors";

const FEATURED_WORKOUT = {
  id: "1",
  title: "Emma&#39;s Core Challenge",
  category: "Intermediate",
  image:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  duration: "60 min",
  calories: 350,
  description:
    "Want your body to be healthy. Join our program with directions according to body's goals.",
  exercises: [
    { name: "Simple Warm-Up Exercises", duration: "0:30" },
    { name: "Stability Training Basics", duration: "1:00" },
    { name: "Core Plank Series", duration: "0:45" },
  ],
};

const BEGINNER_WORKOUTS = [
  {
    id: "2",
    title: "Lea's Cardio Starter",
    category: "Beginner",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
    duration: "45 min",
    calories: 280,
    isPro: false,
  },
  {
    id: "3",
    title: "Alex's HIIT Power Series",
    category: "Beginner",
    image:
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80",
    duration: "30 min",
    calories: 320,
    isPro: false,
  },
  {
    id: "4",
    title: "Luca's Leg Day Inferno",
    category: "Beginner",
    image:
      "https://images.unsplash.com/photo-1434608519344-49d77a124f62?w=800&q=80",
    duration: "50 min",
    calories: 400,
    isPro: true,
  },
  {
    id: "5",
    title: "Maya's Endurance Burn",
    category: "Beginner",
    image:
      "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&q=80",
    duration: "40 min",
    calories: 300,
    isPro: false,
  },
];

const NEW_WORKOUTS = [
  {
    id: "6",
    title: "Chris Power Lift",
    category: "Advance",
    image:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
  },
  {
    id: "7",
    title: "Yoga Flow Morning",
    category: "Beginner",
    image:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
  },
];

function getGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

type Workout = {
  id: string;
  title: string;
  category: string;
  image: string;
  duration?: string;
  calories?: number;
  isPro?: boolean;
  description?: string;
  exercises?: { name: string; duration: string }[];
};

export default function ExploreScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("there");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filters = useMemo(
    () => [t.beginner, t.intermediate, t.advance],
    [t.beginner, t.intermediate, t.advance],
  );
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  React.useEffect(() => {
    setActiveFilter(filters[0]);
  }, [filters]);

  useEffect(() => {
    getItem("user_name").then((name) => {
      if (name) setUserName(name);
    });
  }, []);

  function getFormattedDate(): string {
    const now = new Date();
    return `${t.days[(now.getDay() + 6) % 7]} ${now.getDate()} ${t.months[now.getMonth()].slice(0, 3)}`;
  }

  function openWorkoutModal(workout: Workout) {
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
        category: selectedWorkout.category,
        image: selectedWorkout.image,
        duration: selectedWorkout.duration ?? "",
        calories: selectedWorkout.calories?.toString() ?? "",
        description: selectedWorkout.description ?? "",
      },
    });
  }

  function handleFeaturedTap() {
    router.push({
      pathname: "/(tabs)/explore/workout-detail",
      params: {
        id: FEATURED_WORKOUT.id,
        title: FEATURED_WORKOUT.title,
        category: FEATURED_WORKOUT.category,
        image: FEATURED_WORKOUT.image,
        duration: FEATURED_WORKOUT.duration,
        calories: FEATURED_WORKOUT.calories.toString(),
        description: FEATURED_WORKOUT.description,
      },
    });
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header greeting ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.helloText}>{t.hello} Mathis,</Text>
            <Text style={styles.greetingText}>{t[getGreetingKey()]} 👋</Text>
          </View>
        </View>

        {/* ── Today's community favorite ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.todaysCommunityFavorite}</Text>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
        </View>

        <TouchableOpacity
          style={styles.featuredCard}
          activeOpacity={0.9}
          onPress={handleFeaturedTap}
        >
          <Image
            source={{ uri: FEATURED_WORKOUT.image }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredTag}>{t.communityTopPick}</Text>
            <Text style={styles.featuredSubtitle}>
              | Emma&apos;s Core Challenge
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Workout Categories ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.workoutCategories}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>{t.seeAll}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter pills */}
        <View style={styles.pillRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, activeFilter === f && styles.pillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.pillText,
                  activeFilter === f && styles.pillTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category workout cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {BEGINNER_WORKOUTS.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.categoryCard}
              activeOpacity={0.85}
              onPress={() => openWorkoutModal(w)}
            >
              <Image
                source={{ uri: w.image }}
                style={styles.categoryCardImage}
                resizeMode="cover"
              />
              <View style={styles.categoryCardOverlay}>
                <Text style={styles.categoryCardTitle} numberOfLines={2}>
                  {w.title}
                </Text>
                <Text style={styles.categoryCardSub}>
                  | {t.workoutsLabel2} · {w.category}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── New Workouts ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.newWorkouts}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {NEW_WORKOUTS.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.newCard}
              activeOpacity={0.85}
              onPress={() => openWorkoutModal(w)}
            >
              <Image
                source={{ uri: w.image }}
                style={styles.newCardImage}
                resizeMode="cover"
              />
              <View style={styles.newCardOverlay}>
                <Text style={styles.newCardTitle} numberOfLines={2}>
                  {w.title}
                </Text>
                <Text style={styles.categoryCardSub}>| {w.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category workout cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {BEGINNER_WORKOUTS.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.categoryCard}
              activeOpacity={0.85}
              onPress={() => openWorkoutModal(w)}
            >
              <Image
                source={{ uri: w.image }}
                style={styles.categoryCardImage}
                resizeMode="cover"
              />
              <View style={styles.categoryCardOverlay}>
                <Text style={styles.categoryCardTitle} numberOfLines={2}>
                  {w.title}
                </Text>
                <Text style={styles.categoryCardSub}>
                  | {t.workoutsLabel2} · {w.category}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── New Workouts ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.newWorkouts}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {NEW_WORKOUTS.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.newCard}
              activeOpacity={0.85}
              onPress={() => openWorkoutModal(w)}
            >
              <Image
                source={{ uri: w.image }}
                style={styles.newCardImage}
                resizeMode="cover"
              />
              <View style={styles.newCardOverlay}>
                <Text style={styles.newCardTitle} numberOfLines={2}>
                  {w.title}
                </Text>
                <Text style={styles.categoryCardSub}>| {w.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* ── Workout Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedWorkout && selectedWorkout.isPro ? (
              <>
                <Image
                  source={{ uri: selectedWorkout.image }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>{t.upgradeToPremium}</Text>
                  <Text style={styles.modalWorkoutTitle}>
                    {selectedWorkout.title}
                  </Text>
                  <Text style={styles.modalDescription}>
                    {t.subscribePremium}
                  </Text>
                  <TouchableOpacity style={styles.premiumButton}>
                    <Text style={styles.premiumButtonText}>{t.bePremium}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.cancelLink}
                  >
                    <Text style={styles.cancelText}>{t.cancel2}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : selectedWorkout ? (
              <>
                <Image
                  source={{ uri: selectedWorkout.image }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <View style={styles.modalBody}>
                  <Text style={styles.modalWorkoutTitle}>
                    {selectedWorkout.title}
                  </Text>
                  <Text style={styles.modalCategory}>
                    {selectedWorkout.category}
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
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: WorkoutTheme.background,
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
    color: WorkoutTheme.text.primary,
  },
  greetingText: {
    fontSize: 15,
    color: WorkoutTheme.text.secondary,
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
    color: WorkoutTheme.text.primary,
  },
  dateText: {
    fontSize: 13,
    color: WorkoutTheme.accent.purple,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 13,
    color: WorkoutTheme.accent.purple,
    fontWeight: "600",
  },
  featuredCard: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  featuredTag: {
    color: WorkoutTheme.text.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  featuredSubtitle: {
    color: WorkoutTheme.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  pillActive: {
    backgroundColor: WorkoutTheme.accent.purple,
    borderColor: WorkoutTheme.accent.purple,
  },
  pillText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  pillTextActive: {
    color: WorkoutTheme.text.primary,
  },

  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  categoryCard: {
    width: 220,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
  },
  categoryCardImage: {
    width: "100%",
    height: "100%",
  },
  categoryCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  categoryCardTitle: {
    color: WorkoutTheme.text.primary,
    fontWeight: "bold",
    fontSize: 13,
  },
  categoryCardSub: {
    color: WorkoutTheme.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },

  newCard: {
    width: 160,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
  },
  newCardImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
  },
  newCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  newCardTitle: {
    color: WorkoutTheme.text.primary,
    fontWeight: "bold",
    fontSize: 12,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: WorkoutTheme.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: 200,
  },
  modalBody: {
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: WorkoutTheme.text.primary,
    marginBottom: 6,
  },
  modalWorkoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: WorkoutTheme.text.primary,
    textAlign: "center",
    marginBottom: 6,
  },
  modalCategory: {
    fontSize: 14,
    color: WorkoutTheme.accent.purple,
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: WorkoutTheme.text.secondary,
    textAlign: "center",
    marginBottom: 20,
  },
  useButton: {
    backgroundColor: WorkoutTheme.accent.purple,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  useButtonText: {
    color: WorkoutTheme.text.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  premiumButton: {
    backgroundColor: "#F0B429",
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  premiumButtonText: {
    color: WorkoutTheme.background,
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelLink: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  cancelText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 14,
  },
});
