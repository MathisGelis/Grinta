import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useFocusEffect, router } from "expo-router";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { mediaUrl } from "@/services/api";
import { useTranslation } from "@/contexts/LanguageContext";
import { StatsService, Consistency } from "@/services/stats.service";
import { WorkoutService, CompletedWorkout, COMPLETED_PAGE_SIZE } from "@/services/workout.service";
import { PostsService } from "@/services/posts.service";

import { WorkoutTheme } from "@/constants/Colors";
import Screen from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import SectionHeader from "@/components/ui/SectionHeader";
import IconButton from "@/components/ui/IconButton";
import PressableScale from "@/components/ui/PressableScale";
import SegmentedControl from "@/components/ui/SegmentedControl";
import StatsCalendar, {
  CalendarView,
  dayKey,
} from "@/components/stats/StatsCalendar";
import { format } from "@/i18n/translations";
function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export default function StatsScreen() {
  const { t } = useTranslation();
  const [view, setView] = useState<CalendarView>("week");
  const [tab, setTab] = useState<"sessions" | "data">("sessions");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [consistency, setConsistency] = useState<Consistency | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<
    CompletedWorkout[]
  >([]);
  const [publishedPosts, setPublishedPosts] = useState<Record<string, string>>({});
  const [hasMore, setHasMore] = useState(false);
  const loadingMore = useRef(false);

  const shiftPeriod = (direction: -1 | 1) => {
    setAnchor((d) => {
      if (view === "week") {
        const next = new Date(d);
        next.setDate(d.getDate() + direction * 7);
        return next;
      }
      return new Date(d.getFullYear(), d.getMonth() + direction, 1);
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const [consistencyData, workoutsData, published] = await Promise.all([
        StatsService.getConsistency(),
        WorkoutService.getCompleted({ limit: COMPLETED_PAGE_SIZE }),
        PostsService.getPublishedWorkoutMap().catch(() => ({})),
      ]);
      setConsistency(consistencyData);
      setCompletedWorkouts(workoutsData);
      setHasMore(workoutsData.length === COMPLETED_PAGE_SIZE);
      setPublishedPosts(published);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Historique paginé : on charge les pages suivantes quand le calendrier remonte avant la plus ancienne séance reçue.
  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore || completedWorkouts.length === 0) return;
    loadingMore.current = true;
    try {
      const page = await WorkoutService.getCompleted({
        limit: COMPLETED_PAGE_SIZE,
        before: completedWorkouts[completedWorkouts.length - 1].id,
      });
      setCompletedWorkouts((prev) => [...prev, ...page]);
      setHasMore(page.length === COMPLETED_PAGE_SIZE);
    } catch {
    } finally {
      loadingMore.current = false;
    }
  }, [hasMore, completedWorkouts]);

  useEffect(() => {
    if (!hasMore || completedWorkouts.length === 0) return;
    const oldest = new Date(completedWorkouts[completedWorkouts.length - 1].completionDate);
    const periodStart =
      view === "week"
        ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 7)
        : new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    if (oldest > periodStart) void loadMore();
  }, [anchor, view, hasMore, completedWorkouts, loadMore]);

  const currentStreak = consistency?.currentStreakDays ?? 0;

  const workoutDays = useMemo(
    () =>
      new Set(completedWorkouts.map((w) => dayKey(new Date(w.completionDate)))),
    [completedWorkouts],
  );

  const selectedDateStr = dayKey(selectedDate);
  const dayWorkouts = completedWorkouts.filter(
    (w) => dayKey(new Date(w.completionDate)) === selectedDateStr,
  );

  const dayCalories = dayWorkouts.reduce((sum, w) => {
    const mins = w.totalDurationSeconds / 60;
    return sum + Math.round(mins * 7.5);
  }, 0);

  const totalWorkouts = consistency?.totalWorkouts ?? completedWorkouts.length;

  const handleDeleteWorkout = (workout: CompletedWorkout) => {
    Alert.alert(t.delete, `${t.delete} "${workout.title}" ?`, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await WorkoutService.deleteCompleted(workout.id);
            setCompletedWorkouts((prev) =>
              prev.filter((w) => w.id !== workout.id),
            );
          } catch {
            Alert.alert(t.error, t.cannotDelete);
          }
        },
      },
    ]);
  };

  const handlePublishWorkout = (workout: CompletedWorkout) => {
    const publishedPostId = publishedPosts[workout.id];
    const isPublished = !!publishedPostId;
    Alert.alert(
      isPublished ? t.unpublish : t.publish,
      isPublished
        ? format(t.unpublishConfirm, { title: workout.title })
        : format(t.publishConfirm, { title: workout.title }),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: isPublished ? t.remove : t.publish,
          onPress: async () => {
            try {
              if (isPublished) {
                await PostsService.deletePost(publishedPostId);
                setPublishedPosts((prev) => {
                  const next = { ...prev };
                  delete next[workout.id];
                  return next;
                });
              } else {
                const { id } = await PostsService.createPost(workout.id);
                setPublishedPosts((prev) => ({ ...prev, [workout.id]: id }));
              }
            } catch (err) {
              // Les messages du serveur sont en français (« Ce workout est déjà publié. »).
              Alert.alert(
                t.error,
                err instanceof Error && err.message ? err.message : t.cannotUpdatePublication,
              );
              PostsService.getPublishedWorkoutMap().then(setPublishedPosts).catch(() => {});
            }
          },
        },
      ],
    );
  };

  const formatWorkoutDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${t.days[(d.getDay() + 6) % 7]}, ${t.months[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  };

  return (
    <Screen>
      <StatsCalendar
        view={view}
        onViewChange={(next) => {
          setView(next);
          setAnchor(selectedDate);
        }}
        anchor={anchor}
        selected={selectedDate}
        onSelect={setSelectedDate}
        onShift={shiftPeriod}
        workoutDays={workoutDays}
      />

      <Text className="text-center text-lg font-semibold text-ink">
        {`${t.days[(selectedDate.getDay() + 6) % 7]} ${selectedDate.getDate()} ${t.months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`}
      </Text>

      <SegmentedControl<"sessions" | "data">
        value={tab}
        onChange={setTab}
        options={[
          { value: "sessions", label: t.sessions },
          { value: "data", label: t.dataLabel },
        ]}
      />

      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : (
        <>
          {tab === "data" && (
            <>
              <Card size="hero" tone="accent" className="gap-1">
                <Text className="text-sm text-ink/70">
                  {t.dailyCaloriesBurned}
                </Text>
                <Stat value={dayCalories} unit={t.calShort} size="xl" />
              </Card>

              <View className="flex-row gap-3">
                <Card size="tile" className="flex-1 gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
                    <Ionicons
                      name="flame"
                      size={18}
                      color={WorkoutTheme.accent.purple}
                    />
                  </View>
                  <Stat value={currentStreak} unit="d" label={t.streak} />
                </Card>
                <Card size="tile" className="flex-1 gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-info-tint">
                    <Ionicons
                      name="barbell"
                      size={18}
                      color={WorkoutTheme.status.info}
                    />
                  </View>
                  <Stat value={totalWorkouts} label={t.total} />
                </Card>
                <Card size="tile" className="flex-1 gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-success-tint">
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={WorkoutTheme.status.success}
                    />
                  </View>
                  <Stat value={dayWorkouts.length} label={t.completedLabel} />
                </Card>
              </View>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t.myRecordsTitle}
                onPress={() => router.push("/(tabs)/stats/records" as any)}
                className="flex-row items-center gap-4 rounded-card bg-surface p-4"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
                  <Ionicons name="trophy" size={22} color={WorkoutTheme.accent.purple} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-ink">{t.myRecordsTitle}</Text>
                  <Text className="mt-0.5 text-xs text-ink-muted">{t.myRecordsHint}</Text>
                </View>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-raised">
                  <MaterialCommunityIcons name="arrow-top-right" size={18} color={WorkoutTheme.text.primary} />
                </View>
              </PressableScale>
            </>
          )}

          {tab === "sessions" && (
            <>
              <View className="gap-4">
                <SectionHeader title={t.finishedWorkout} />
                {dayWorkouts.length === 0 && (
                  <Card className="items-center">
                    <Text className="text-sm text-ink-muted">
                      {t.restDay} 💤
                    </Text>
                  </Card>
                )}
                <View className="gap-3">
                  {dayWorkouts.map((w) => (
                    <View
                      key={w.id}
                      className="flex-row items-center gap-3 rounded-card bg-surface p-4"
                    >
                      <PressableScale
                        className="flex-1 flex-row items-center gap-3"
                        accessibilityRole="button"
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
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={WorkoutTheme.text.primary}
                            />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text
                            className="text-base font-semibold text-ink"
                            numberOfLines={1}
                          >
                            {w.title}
                          </Text>
                          <Text className="mt-0.5 text-xs text-ink-muted">
                            {formatWorkoutDate(w.completionDate)} ·{" "}
                            {formatDuration(w.totalDurationSeconds)}
                          </Text>
                        </View>
                      </PressableScale>
                      <IconButton
                        icon={
                          !!publishedPosts[w.id]
                            ? "cloud-done"
                            : "cloud-upload-outline"
                        }
                        label={!!publishedPosts[w.id] ? t.unpublish : t.publish}
                        onPress={() => handlePublishWorkout(w)}
                        className="opacity-90"
                      />
                      <IconButton
                        icon="trash-outline"
                        variant="danger"
                        label={t.remove}
                        onPress={() => handleDeleteWorkout(w)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
