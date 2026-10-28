import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Exercise,
  ExerciseStats,
  getExerciseById,
  getExerciseStats,
  getUserCreatedExerciseIds,
} from "@/services/exercises.service";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import IconButton from "@/components/ui/IconButton";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import MuscleMap from "@/components/ui/MuscleMap";
import type { MuscleValue } from "@/utils/muscles";

export default function ExerciseDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!exerciseId) return;
    try {
      setError(null);
      const [data, userStats, createdIds] = await Promise.all([
        getExerciseById(exerciseId),
        getExerciseStats(exerciseId).catch(() => null),
        getUserCreatedExerciseIds(),
      ]);
      setExercise(data);
      setStats(userStats);
      setCanEdit(createdIds.includes(exerciseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [exerciseId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const muscle = (key: string) => t.muscleNames[key] ?? key.replace(/_/g, " ");
  const mapData = useMemo<MuscleValue[]>(() => {
    if (!exercise) return [];
    return [
      {
        muscle: exercise.primary_muscle,
        value: 2,
        color: WorkoutTheme.accent.purple,
        label: t.primaryMuscle,
      },
      ...(exercise.secondary_muscles ?? [])
        .filter((m) => m !== exercise.primary_muscle)
        .map((m) => ({
          muscle: m,
          value: 1,
          color: withAlpha(WorkoutTheme.accent.purple, 0.5),
          label: t.secondaryMuscles,
        })),
    ];
  }, [exercise, t]);
  const mapLegend = [
    { color: WorkoutTheme.accent.purple, label: t.primaryMuscle },
    { color: withAlpha(WorkoutTheme.accent.purple, 0.5), label: t.secondaryMuscles },
  ];
  const hasStats = stats && (stats.PR != null || stats.last_weight != null);

  return (
    <View className="flex-1">
      <ScreenBackground />
      <ScreenHeader
        title={exercise?.name ?? ""}
        right={
          canEdit ? (
            <IconButton
              icon="create-outline"
              label={t.editExercise}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/workouts/create/exercise",
                  params: { exerciseId },
                } as any)
              }
            />
          ) : undefined
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : error || !exercise ? (
        <View className="items-center px-5">
          <Text className="text-danger">{error ?? t.noExerciseFound}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        >
          <Card size="hero" className="gap-4">
            <View className="h-48 items-center justify-center overflow-hidden rounded-tile bg-accent-tint">
              {exercise.image_url ? (
                <Image
                  source={{ uri: exercise.image_url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="barbell" size={56} color={WorkoutTheme.accent.purple} />
              )}
            </View>
            <View>
              <Text className="text-sm text-ink-muted">
                {t.exerciseTypeNames[exercise.exercise_type] ??
                  exercise.exercise_type.replace(/_/g, " ")}
              </Text>
              <Text className="mt-1 text-2xl font-semibold text-ink">
                {exercise.name}
              </Text>
            </View>
          </Card>

          <Card className="gap-5">
            <Text className="text-lg font-semibold text-ink">{t.exerciseInfoTitle}</Text>

            <View className="gap-2">
              <Text className="text-sm text-ink-muted">{t.equipmentType}</Text>
              <View className="h-9 self-start justify-center rounded-full bg-raised px-4">
                <Text className="text-sm font-medium text-ink">
                  {t.equipmentNames[exercise.equipment_type] ??
                    exercise.equipment_type.replace(/_/g, " ")}
                </Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm text-ink-muted">{t.primaryMuscle}</Text>
              <View className="h-9 self-start justify-center rounded-full bg-accent-tint px-4">
                <Text className="text-sm font-medium text-accent-text">
                  {muscle(exercise.primary_muscle)}
                </Text>
              </View>
            </View>

            {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 ? (
              <View className="gap-2">
                <Text className="text-sm text-ink-muted">{t.secondaryMuscles}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {exercise.secondary_muscles.map((m) => (
                    <View key={m} className="h-9 justify-center rounded-full bg-raised px-4">
                      <Text className="text-sm font-medium text-ink">{muscle(m)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </Card>

          <Card className="gap-4">
            <Text className="text-lg font-semibold text-ink">{t.musclesWorkedTitle}</Text>
            <MuscleMap data={mapData} legend={mapLegend} />
          </Card>

          <Card className="gap-4">
            <Text className="text-lg font-semibold text-ink">{t.personalStatsTitle}</Text>
            {hasStats ? (
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-tile bg-accent-tint p-4">
                  <Stat
                    size="md"
                    value={stats?.PR != null ? `${stats.PR} kg` : "–"}
                    label={t.personalRecordLabel}
                  />
                </View>
                <View className="flex-1 rounded-tile bg-raised p-4">
                  <Stat
                    size="md"
                    value={
                      stats?.last_weight != null
                        ? `${stats.last_weight} kg${stats.last_reps != null ? ` × ${stats.last_reps}` : ""}`
                        : "–"
                    }
                    label={t.lastPerformanceLabel}
                  />
                </View>
              </View>
            ) : (
              <View className="items-center gap-2 rounded-tile bg-raised p-6">
                <Ionicons name="stats-chart-outline" size={26} color={WorkoutTheme.text.tertiary} />
                <Text className="text-center text-sm text-ink-muted">
                  {t.noExerciseStats}
                </Text>
              </View>
            )}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}
