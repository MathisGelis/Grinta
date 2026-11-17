import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { mediaUrl } from "@/services/api";
import { WorkoutService, CompletedWorkout, COMPLETED_PAGE_SIZE } from "@/services/completed-workouts.service";
import { useTranslation } from "@/contexts/LanguageContext";
import { WorkoutTheme } from "@/constants/Colors";
import { formatDate } from "@/utils/formatDate";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import EmptyState from "@/components/ui/EmptyState";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import PressableScale from "@/components/ui/PressableScale";
import ErrorState from "@/components/ui/ErrorState";
import { ListSkeleton } from "@/components/ui/skeletons";

export default function CompletedWorkoutsScreen() {
  const headerHeight = useFloatingHeaderHeight();
  const { t, lang } = useTranslation();
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const loadingMore = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const page = await WorkoutService.getCompleted({ limit: COMPLETED_PAGE_SIZE });
      setWorkouts(page);
      setHasMore(page.length === COMPLETED_PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore || workouts.length === 0) return;
    loadingMore.current = true;
    try {
      const page = await WorkoutService.getCompleted({
        limit: COMPLETED_PAGE_SIZE,
        before: workouts[workouts.length - 1].id,
      });
      setWorkouts((prev) => [...prev, ...page]);
      setHasMore(page.length === COMPLETED_PAGE_SIZE);
    } catch {
    } finally {
      loadingMore.current = false;
    }
  }, [hasMore, workouts]);

  return (
    <View className="flex-1">
      <ScreenHeader floating title={t.workoutsLabel} />
      {loading ? (
        <View className="px-4" style={{ paddingTop: headerHeight }}><ListSkeleton count={8} /></View>
      ) : error ? (
        <View style={{ paddingTop: headerHeight }}>
          <ErrorState message={error} onRetry={load} />
        </View>
      ) : (
        <FlatList
          {...chromeScrollProps}
          data={workouts}
          keyExtractor={(w) => w.id}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingTop: headerHeight, paddingHorizontal: 16, paddingBottom: 120, gap: 8 }}
          ListEmptyComponent={
            <EmptyState icon="barbell-outline" title={t.noWorkouts} className="mt-4" />
          }
          renderItem={({ item: w }) => (
            <PressableScale
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-card bg-surface p-4"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/stats/workout-detail",
                  params: { workoutId: w.id },
                } as any)
              }
            >
              {w.photoThumbnailUrl ? (
                <Image
                  source={{ uri: mediaUrl(w.photoThumbnailUrl) }}
                  cachePolicy="disk"
                  contentFit="cover"
                  accessibilityLabel={w.title}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
              ) : (
                <View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <Ionicons name="checkmark" size={20} color={WorkoutTheme.text.primary} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                  {w.title}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-muted">
                  {formatDate(new Date(w.completionDate), lang, "weekday")} ·{" "}
                  {Math.round(w.totalDurationSeconds / 60)} min
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={WorkoutTheme.text.disabled} />
            </PressableScale>
          )}
        />
      )}
    </View>
  );
}
