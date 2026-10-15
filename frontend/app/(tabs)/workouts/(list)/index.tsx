import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Animated, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import GlassSearchBar from "@/components/GlassSearchBar";
import PressableScale from "@/components/ui/PressableScale";
import { useFocusEffect, router } from "expo-router";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import WorkoutCard from "@/components/workout/card/WorkoutCard";
import {
  getPlannedWorkouts,
  PlannedWorkout,
  fullPlannedWorkout,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { keyboardY, bottomOffset } = useKeyboardOffset();
  const [sortBy, setSortBy] = useState<"default" | "name" | "exercises">(
    "default",
  );
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const handleSearchResults = (titles: string[]) => {
    setFilteredWorkouts(workouts.filter((w) => titles.includes(w.title)));
  };

  const sortedWorkouts = [...filteredWorkouts].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title);
    if (sortBy === "exercises")
      return (b.totalExercises ?? 0) - (a.totalExercises ?? 0);
    return 0;
  });

  const loadWorkouts = useCallback(async () => {
    try {
      setError(null);
      const token = await TokenService.get();
      const plannedWorkouts = await getPlannedWorkouts(token || undefined);
      setWorkouts(plannedWorkouts);
      setFilteredWorkouts(plannedWorkouts);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t.loadingError;
      setError(message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWorkouts();
    }, [loadWorkouts]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkouts().finally(() => setRefreshing(false));
  }, [loadWorkouts]);

  return (
    <View className="flex-1">
      {!loading && !error && workouts.length > 0 && (
        <View className="mx-5 mb-4 flex-row gap-3">
          <Card size="tile" className="flex-1 gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
              <Ionicons name="barbell" size={18} color={WorkoutTheme.accent.purple} />
            </View>
            <Stat value={workouts.length} label={t.sessions} />
          </Card>
          <Card size="tile" className="flex-1 gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-success-tint">
              <Ionicons name="fitness" size={18} color={WorkoutTheme.status.success} />
            </View>
            <Stat
              value={workouts.reduce((sum, w) => sum + (w.totalExercises ?? 0), 0)}
              label={t.exercises}
            />
          </Card>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerClassName="grow"
        contentContainerStyle={{ paddingBottom: bottomOffset + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={WorkoutTheme.accent.purple}
            colors={[WorkoutTheme.accent.purple]}
          />
        }
      >
        {loading ? (
          <View className="flex-1 justify-center items-center px-8 py-[60px]">
            <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-4">
              <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
            </View>
            <Text className="text-sm text-ink-muted">{t.loadingWorkouts}</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-8 py-[60px]">
            <View className="w-20 h-20 rounded-full bg-danger-tint items-center justify-center mb-4">
              <Ionicons name="alert-circle" size={48} color={WorkoutTheme.status.danger} />
            </View>
            <Text className="text-xl font-bold text-ink mb-2">{t.oops}</Text>
            <Text className="text-sm text-ink-muted text-center leading-[20px]">{error}</Text>
            <PressableScale
              onPress={() => {
                setLoading(true);
                loadWorkouts();
              }}
              className="mt-6 h-[52px] flex-row items-center gap-2 rounded-full bg-accent px-6"
            >
              <Ionicons name="refresh" size={20} color={WorkoutTheme.text.primary} />
              <Text className="text-ink font-semibold text-sm">{t.retryBtn}</Text>
            </PressableScale>
          </View>
        ) : workouts.length > 0 ? (
          <View className="gap-3 px-5 pt-1">
            {sortedWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onDelete={() => {
                  setWorkouts((prev) =>
                    prev.filter((w) => w.id !== workout.id),
                  );
                }}
                onUpdate={(updatedWorkout: fullPlannedWorkout) => {
                  const updatedPlanned: PlannedWorkout = {
                    id: updatedWorkout.id,
                    title: updatedWorkout.title,
                    description: updatedWorkout.description,
                    totalExercises: updatedWorkout.totalExercises,
                  };
                  setWorkouts((prev) =>
                    prev.map((w) =>
                      w.id === updatedWorkout.id ? updatedPlanned : w,
                    ),
                  );
                }}
              />
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-8 py-[60px]">
            <View className="w-24 h-24 rounded-full bg-info-tint items-center justify-center mb-6">
              <Ionicons name="barbell-outline" size={48} color={WorkoutTheme.accent.purple} />
            </View>
            <Text className="text-xl font-bold text-ink mb-2">{t.noWorkouts}</Text>
            <Text className="text-sm text-ink-muted text-center leading-[20px]">{t.createFirstWorkout}</Text>
            <PressableScale
              onPress={() => router.push("/(tabs)/workouts/create/workout")}
              className="mt-7 h-[52px] flex-row items-center gap-2 rounded-full bg-accent px-6"
            >
              <Ionicons name="add-circle" size={22} color={WorkoutTheme.text.primary} />
              <Text className="text-ink font-semibold text-[15px]">{t.createWorkout}</Text>
            </PressableScale>
          </View>
        )}
      </ScrollView>

      <Animated.View
        className="absolute left-0 right-0 px-5"
        style={{
          bottom: bottomOffset + 12,
          transform: [{ translateY: keyboardY }],
        }}
      >
        <GlassSearchBar
          items={workouts.map((w) => w.title)}
          onResults={handleSearchResults}
          onAdd={() => router.push("/(tabs)/workouts/create/workout")}
          placeholder={t.searchWorkout}
          filter={() => setSortModalVisible(true)}
        />
      </Animated.View>

      <Modal
        isVisible={sortModalVisible}
        onBackdropPress={() => setSortModalVisible(false)}
        onSwipeComplete={() => setSortModalVisible(false)}
        swipeDirection="down"
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="gap-3 rounded-t-hero bg-surface p-5 pb-10">
          <View className="mb-1 h-1.5 w-12 self-center rounded-full bg-raised" />
          <Text className="mb-1 text-xl font-semibold text-ink">{t.sortBy}</Text>
          {(
            [
              { value: "default", label: t.sortDefault },
              { value: "name", label: t.sortName },
              { value: "exercises", label: t.sortExerciseCount },
            ] as const
          ).map((o) => (
            <PressableScale
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected: sortBy === o.value }}
              onPress={() => {
                setSortBy(o.value);
                setSortModalVisible(false);
              }}
              className={`h-12 flex-row items-center justify-between rounded-full px-5 ${sortBy === o.value ? "bg-accent" : "bg-raised"}`}
            >
              <Text className="text-base font-medium text-ink">{o.label}</Text>
              {sortBy === o.value && (
                <Ionicons name="checkmark" size={20} color={WorkoutTheme.text.primary} />
              )}
            </PressableScale>
          ))}
        </View>
      </Modal>
    </View>
  );
}

