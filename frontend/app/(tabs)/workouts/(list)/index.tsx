import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "@/components/ui/PressableScale";
import { useFocusEffect, router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import WorkoutCard from "@/components/workout/card/WorkoutCard";
import WorkoutSortSheet, { WorkoutSort } from "@/components/workout/WorkoutSortSheet";
import {
  plannedWorkoutsList,
  PlannedWorkout,
  fullPlannedWorkout,
} from "@/services/workouts.service";
import { useBottomOffset } from "@/hooks/useKeyboardOffset";
import { useSectionQuery } from "@/contexts/WorkoutsSearchContext";
import { normalizeText } from "@/utils/text";

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const bottomOffset = useBottomOffset();
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>(
    () => plannedWorkoutsList.peek() ?? [],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(() => plannedWorkoutsList.peek() === null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<WorkoutSort>("default");
  const [sortVisible, setSortVisible] = useState(false);
  const openSort = useCallback(() => setSortVisible(true), []);
  const query = useSectionQuery("sessions", openSort);
  const deferredQuery = useDeferredValue(query);

  const loadWorkouts = useCallback(async () => {
    try {
      setError(null);
      setWorkouts(await plannedWorkoutsList.load());
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  useEffect(() => {
    plannedWorkoutsList.set(workouts);
  }, [workouts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkouts().finally(() => setRefreshing(false));
  }, [loadWorkouts]);

  const data = useMemo(() => {
    const needle = normalizeText(deferredQuery.trim());
    const filtered = needle
      ? workouts.filter((w) => normalizeText(w.title).includes(needle))
      : workouts;
    if (sortBy === "default") return filtered;
    return [...filtered].sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title)
        : (b.totalExercises ?? 0) - (a.totalExercises ?? 0),
    );
  }, [workouts, deferredQuery, sortBy]);

  const handleDelete = useCallback((id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleUpdate = useCallback((updated: fullPlannedWorkout) => {
    const next: PlannedWorkout = {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      totalExercises: updated.totalExercises,
    };
    setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? next : w)));
  }, []);

  const closeSort = useCallback(() => setSortVisible(false), []);
  const selectSort = useCallback((sort: WorkoutSort) => {
    setSortVisible(false);
    startTransition(() => setSortBy(sort));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: PlannedWorkout }) => (
      <WorkoutCard workout={item} onDelete={handleDelete} onUpdate={handleUpdate} />
    ),
    [handleDelete, handleUpdate],
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={WorkoutTheme.accent.purple}
      colors={[WorkoutTheme.accent.purple]}
    />
  );

  return (
    <View className="flex-1">
      {loading ? (
        <View className="flex-1 items-center justify-center px-8 py-[60px]">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-surface">
            <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
          </View>
          <Text className="text-sm text-ink-muted">{t.loadingWorkouts}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8 py-[60px]">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-danger-tint">
            <Ionicons name="alert-circle" size={48} color={WorkoutTheme.status.danger} />
          </View>
          <Text className="mb-2 text-xl font-bold text-ink">{t.oops}</Text>
          <Text className="text-center text-sm leading-[20px] text-ink-muted">{error}</Text>
          <PressableScale
            onPress={() => {
              setLoading(true);
              loadWorkouts();
            }}
            className="mt-6 h-[52px] flex-row items-center gap-2 rounded-full bg-accent px-6"
          >
            <Ionicons name="refresh" size={20} color={WorkoutTheme.text.primary} />
            <Text className="text-sm font-semibold text-ink">{t.retryBtn}</Text>
          </PressableScale>
        </View>
      ) : workouts.length > 0 ? (
        <FlatList {...chromeScrollProps}
          data={data}
          keyExtractor={(w) => w.id}
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          contentContainerClassName="px-5 pt-1"
          contentContainerStyle={{ paddingBottom: bottomOffset + 80 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8 py-[60px]">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-info-tint">
            <Ionicons name="barbell-outline" size={48} color={WorkoutTheme.accent.purple} />
          </View>
          <Text className="mb-2 text-xl font-bold text-ink">{t.noWorkouts}</Text>
          <Text className="text-center text-sm leading-[20px] text-ink-muted">{t.createFirstWorkout}</Text>
          <PressableScale
            onPress={() => router.push("/(tabs)/workouts/create/workout")}
            className="mt-7 h-[52px] flex-row items-center gap-2 rounded-full bg-accent px-6"
          >
            <Ionicons name="add-circle" size={22} color={WorkoutTheme.text.primary} />
            <Text className="text-[15px] font-semibold text-ink">{t.createWorkout}</Text>
          </PressableScale>
        </View>
      )}

      <WorkoutSortSheet
        visible={sortVisible}
        value={sortBy}
        onClose={closeSort}
        onSelect={selectSort}
      />
    </View>
  );
}
