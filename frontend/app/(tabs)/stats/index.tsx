import React, { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { StatsService, Consistency } from "@/services/stats.service";
import { WorkoutService, CompletedWorkout } from "@/services/workout.service";
import { PostsService } from "@/services/posts.service";

import { WorkoutTheme } from "@/constants/Colors";
import Screen from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import SectionHeader from "@/components/ui/SectionHeader";
import IconButton from "@/components/ui/IconButton";
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
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());

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
      const [consistencyData, workoutsData] = await Promise.all([
        StatsService.getConsistency(),
        WorkoutService.getCompleted(),
      ]);
      setConsistency(consistencyData);
      setCompletedWorkouts(workoutsData);
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

  const totalWorkouts = completedWorkouts.length;

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
    const isPublished = publishedIds.has(workout.id);
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
                setPublishedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(workout.id);
                  return next;
                });
              } else {
                await PostsService.createPost(workout.id);
                setPublishedIds((prev) => new Set(prev).add(workout.id));
              }
            } catch {
              Alert.alert(t.error, t.cannotUpdatePublication);
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
        variant="glass"
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
                      <View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={WorkoutTheme.text.primary}
                        />
                      </View>
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
                      <IconButton
                        icon={
                          publishedIds.has(w.id)
                            ? "cloud-done"
                            : "cloud-upload-outline"
                        }
                        label={publishedIds.has(w.id) ? t.unpublish : t.publish}
                        onPress={() => handlePublishWorkout(w)}
                        className="opacity-90"
                      />
                      <IconButton
                        icon="trash-outline"
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
