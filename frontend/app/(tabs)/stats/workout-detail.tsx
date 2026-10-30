import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { LOCALES } from "@/i18n/labels";
import { format } from "@/i18n/translations";
import {
  CompletedWorkoutDetail,
  WorkoutService,
} from "@/services/workout.service";
import { StatsService, WorkoutStats } from "@/services/stats.service";
import ExerciseSetupItem, {
  ExerciseSetupData,
} from "@/components/workout/exercises/ExerciseSetupItem";
import MuscleMap from "@/components/ui/MuscleMap";
import { getExercisesById, Exercise } from "@/services/exercises.service";
import type { MuscleValue } from "@/utils/muscles";
import ExerciseSearch from "@/components/workout/exercises/ExerciseSearch";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Stat from "@/components/ui/Stat";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { FormField, TextField } from "@/components/ui/FormField";
import WorkoutImagePicker from "@/components/workout/editor/WorkoutImagePicker";
import NewRecordsSheet from "@/components/workout/badges/NewRecordsSheet";
import { mediaUrl } from "@/services/api";
import { PhotoService } from "@/services/photo.service";
import type { Badge } from "@/services/badges.service";
import { UserService } from "@/services/user.service";
import { duplicateWorkoutFromCompleted } from "@/services/workouts.service";
import { realLifeText } from "@/utils/realLife";
import ShareCardSheet, { type ShareCardData } from "@/components/share/ShareCardSheet";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

function formatVolume(volume: number): string {
  return volume >= 1000
    ? `${(volume / 1000).toFixed(1)} T`
    : `${Math.round(volume)} kg`;
}

export default function CompletedWorkoutDetailScreen() {
  const { t, lang } = useTranslation();
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [detail, setDetail] = useState<CompletedWorkoutDetail | null>(null);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftExercises, setDraftExercises] = useState<ExerciseSetupData[]>([]);
  // undefined : photo inchangée, null : photo retirée, chaîne : nouvelle photo locale.
  const [draftPhoto, setDraftPhoto] = useState<string | null | undefined>(undefined);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [duplicating, setDuplicating] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [exercisesById, setExercisesById] = useState<Map<string, Exercise>>(
    new Map(),
  );

  const load = useCallback(async () => {
    if (!workoutId) return;
    try {
      setError(null);
      const [data, workoutStats, exercises] = await Promise.all([
        WorkoutService.getCompletedById(workoutId),
        StatsService.getWorkoutStats(workoutId).catch(() => null),
        getExercisesById().catch(() => new Map<string, Exercise>()),
      ]);
      setDetail(data);
      setStats(workoutStats);
      setExercisesById(exercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [workoutId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const workout = detail?.workout;

  useEffect(() => {
    let cancelled = false;
    UserService.getMe()
      .then((me) => !cancelled && setMyUsername(me.uniqueName))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const duplicate = async () => {
    if (!workout || duplicating) return;
    try {
      setDuplicating(true);
      await duplicateWorkoutFromCompleted(workout.id);
      Alert.alert(t.dupDone, t.dupDoneMessage, [
        { text: "OK", style: "cancel" },
        { text: t.dupView, onPress: () => router.navigate("/(tabs)/workouts/(list)" as any) },
      ]);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setDuplicating(false);
    }
  };

  const shareData: ShareCardData | null =
    workout && stats
      ? {
          title: workout.title,
          username: myUsername ?? undefined,
          photoUrl: workout.photoUrl,
          durationSeconds: workout.totalDurationSeconds,
          totalVolume: stats.totalVolume,
          totalSets: stats.totalSets,
          totalReps: stats.totalReps,
          realLife: stats.realLifeComparison,
          exercises: workout.exercises.map((entry) => ({
            name: entry.exercise?.name ?? "–",
            sets: entry.sets ?? [],
          })),
        }
      : null;

  const startEditing = () => {
    if (!workout) return;
    setDraftTitle(workout.title);
    setDraftDescription(workout.description ?? "");
    setDraftExercises(
      workout.exercises.map((entry) => ({
        id: entry.exercise?.id ?? entry.id,
        name: entry.exercise?.name ?? "–",
        sets: (entry.sets ?? []).map((set) => ({
          reps: set.reps,
          weight: set.weight,
        })),
      })),
    );
    setDraftPhoto(undefined);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (saving) return;
    setEditing(false);
  };

  const updateExercise = (index: number, updated: ExerciseSetupData) =>
    setDraftExercises((prev) =>
      prev.map((item, i) => (i === index ? updated : item)),
    );

  const removeExercise = (index: number) =>
    setDraftExercises((prev) => prev.filter((_, i) => i !== index));

  const saveChanges = async () => {
    if (!workout) return;
    if (!draftTitle.trim()) {
      Alert.alert(t.error, t.pleaseEnterTitle);
      return;
    }
    try {
      setSaving(true);
      const timers = new Map(
        workout.exercises.map((entry) => [
          entry.exercise?.id ?? entry.id,
          entry.timerSeconds,
        ]),
      );
      const saved = await WorkoutService.updateCompleted(workout.id, {
        title: draftTitle.trim(),
        description: draftDescription,
        exercises: draftExercises.map((exercise) => {
          const timer = timers.get(exercise.id);
          return {
            exerciseId: exercise.id,
            sets: exercise.sets,
            ...(timer != null ? { timerSeconds: timer } : {}),
          };
        }),
      });
      let photoError = false;
      try {
        if (typeof draftPhoto === "string") {
          await PhotoService.uploadWorkoutPhoto(workout.id, draftPhoto);
        } else if (draftPhoto === null && workout.photoUrl) {
          await PhotoService.removeWorkoutPhoto(workout.id);
        }
      } catch {
        photoError = true;
      }
      await load();
      setEditing(false);
      if (saved?.badges && saved.badges.length > 0) {
        setNewBadges(saved.badges);
      } else {
        Alert.alert(
          photoError ? t.error : t.success,
          photoError ? t.photoNotSent : t.workoutUpdated,
        );
      }
    } catch (err) {
      Alert.alert(
        t.error,
        err instanceof Error ? err.message : t.cannotSaveProfile,
      );
    } finally {
      setSaving(false);
    }
  };
  const muscleData = useMemo<MuscleValue[]>(() => {
    const sets = new Map<string, number>();
    const add = (muscle: string, value: number) =>
      sets.set(muscle, (sets.get(muscle) ?? 0) + value);

    for (const entry of workout?.exercises ?? []) {
      const exerciseId = entry.exercise?.id ?? entry.id;
      const exercise = exercisesById.get(exerciseId);
      const primary =
        exercise?.primary_muscle ??
        stats?.exercises.find((e) => e.exerciseId === exerciseId)
          ?.primaryMuscle;
      const setCount = entry.sets?.length ?? 0;
      if (!primary || setCount === 0) continue;

      add(primary, setCount);
      for (const secondary of exercise?.secondary_muscles ?? []) {
        add(secondary, setCount * 0.5);
      }
    }

    return [...sets.entries()].map(([muscle, value]) => ({ muscle, value }));
  }, [workout, exercisesById, stats]);

  const statsByExercise = new Map(
    stats?.exercises.map((e) => [e.exerciseId, e]),
  );

  const tiles = stats
    ? [
        {
          label: t.calories,
          value: String(Math.round(stats.estimatedCalories)),
        },
        { label: t.volumeLabel, value: formatVolume(stats.totalVolume) },
        { label: t.sets, value: String(stats.totalSets) },
        { label: t.repsLabel, value: String(stats.totalReps) },
      ]
    : [];

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader
        title={workout?.title ?? ""}
        right={
          workout && !editing ? (
            <IconButton
              icon="create-outline"
              label={t.editLabel}
              onPress={startEditing}
            />
          ) : undefined
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : error || !workout ? (
        <View className="items-center px-5">
          <Text className="text-danger">{error ?? t.loadingError}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{
            paddingBottom: TAB_BAR_SPACE + insets.bottom,
          }}
        >
          {editing ? (
            <>
              <Card size="hero" className="gap-4">
                <FormField label={t.titleLabel} required>
                  <TextField
                    placeholder={t.workoutNameLabel}
                    value={draftTitle}
                    onChangeText={setDraftTitle}
                    editable={!saving}
                  />
                </FormField>
                <FormField label={t.descriptionOptional}>
                  <TextField
                    multiline
                    placeholder={t.addDescriptionPlaceholder}
                    value={draftDescription}
                    onChangeText={setDraftDescription}
                    editable={!saving}
                  />
                </FormField>
                <WorkoutImagePicker
                  image={draftPhoto === undefined ? (workout.photoUrl ?? null) : draftPhoto}
                  onImageChange={setDraftPhoto}
                />
              </Card>

              <Text className="mt-2 text-xl font-semibold text-ink">
                {t.exercises}
              </Text>
              {draftExercises.map((exercise, index) => (
                <ExerciseSetupItem
                  key={`${exercise.id}-${index}`}
                  exercise={exercise}
                  onUpdate={(updated) => updateExercise(index, updated)}
                  onRemove={() => removeExercise(index)}
                />
              ))}

              <Button
                variant="secondary"
                icon="add"
                label={t.addExerciseTitle}
                disabled={saving}
                onPress={() => setAddVisible(true)}
              />

              <View className="flex-row gap-3">
                <Button
                  className="flex-1"
                  variant="secondary"
                  label={t.cancel}
                  disabled={saving}
                  onPress={cancelEditing}
                />
                <Button
                  className="flex-1"
                  icon="checkmark"
                  label={t.save}
                  loading={saving}
                  onPress={saveChanges}
                />
              </View>

              <ExerciseSearch
                visible={addVisible}
                onClose={() => setAddVisible(false)}
                onSelectExercise={(exercise) => {
                  setDraftExercises((prev) => [
                    ...prev,
                    {
                      id: exercise.id,
                      name: exercise.name,
                      sets: [{ reps: 10, weight: 0 }],
                    },
                  ]);
                  setAddVisible(false);
                }}
                existingExerciseIds={draftExercises.map((e) => e.id)}
              />
            </>
          ) : (
            <>
              <Card size="hero" className="gap-4">
                {workout.photoUrl ? (
                  <Image
                    source={{ uri: mediaUrl(workout.photoUrl) }}
                    cachePolicy="disk"
                    contentFit="cover"
                    transition={150}
                    accessibilityLabel={workout.title}
                    style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 22 }}
                  />
                ) : null}
                <View className="flex-row">
                  <Stat
                    size="md"
                    label={t.completedLabel}
                    value={new Date(workout.completionDate).toLocaleDateString(
                      LOCALES[lang],
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                    className="flex-1"
                  />
                  <Stat
                    size="md"
                    label={t.duration}
                    value={formatDuration(workout.totalDurationSeconds)}
                    className="flex-1"
                  />
                </View>
                {workout.description ? (
                  <Text className="text-sm text-ink-soft">
                    {workout.description}
                  </Text>
                ) : null}
              </Card>

              {stats ? (
                <>
                  <View className="flex-row flex-wrap gap-3">
                    {tiles.map((tile) => (
                      <View
                        key={tile.label}
                        className="rounded-tile bg-surface p-4"
                        style={{ width: "47.5%", flexGrow: 1 }}
                      >
                        <Stat size="md" value={tile.value} label={tile.label} />
                      </View>
                    ))}
                  </View>

                  {realLifeText(t, stats.realLifeComparison) ? (
                    <Card tone="accentTint" size="tile" className="flex-row items-center gap-3">
                      <Text className="flex-1 text-sm font-semibold text-ink">
                        {t.rlTitle} · {realLifeText(t, stats.realLifeComparison)}
                      </Text>
                    </Card>
                  ) : null}

                  {stats.workoutsCompletedThatDay > 1 ? (
                    <Card tone="accentTint" size="tile" className="gap-1">
                      <Stat
                        size="md"
                        value={formatVolume(stats.fullDayLoad)}
                        label={t.dayLoadLabel}
                      />
                      <Text className="text-xs text-accent-text">
                        {format(t.workoutOfDayNote, {
                          n: stats.workoutsCompletedThatDay,
                        })}
                      </Text>
                    </Card>
                  ) : null}
                </>
              ) : null}

              {muscleData.length > 0 ? (
                <Card className="gap-4">
                  <Text className="text-lg font-semibold text-ink">
                    {t.musclesWorkedTitle}
                  </Text>
                  <MuscleMap data={muscleData} unit={t.sets.toLowerCase()} />
                </Card>
              ) : null}

              <Text className="mt-2 text-xl font-semibold text-ink">
                {t.exercises}
              </Text>
              {workout.exercises.map((entry) => {
                const exerciseId = entry.exercise?.id ?? entry.id;
                const exerciseStats = statsByExercise.get(exerciseId);
                const sets = entry.sets ?? [];
                return (
                  <Card key={entry.id} className="gap-4">
                    <Text className="text-lg font-semibold text-ink">
                      {entry.exercise?.name ?? exerciseStats?.name ?? "–"}
                    </Text>

                    {exerciseStats ? (
                      <View className="flex-row gap-3">
                        <View className="flex-1 rounded-tile bg-raised p-3">
                          <Stat
                            size="md"
                            value={`${exerciseStats.heaviestWeight} kg`}
                            label={t.heaviestWeightLabel}
                          />
                        </View>
                        <View className="flex-1 rounded-tile bg-raised p-3">
                          <Stat
                            size="md"
                            value={`${Math.round(exerciseStats.estimatedOneRepMax)} kg`}
                            label={t.oneRepMaxLabel}
                          />
                        </View>
                      </View>
                    ) : null}

                    <View className="gap-2">
                      {sets.map((set, index) => (
                        <View
                          key={index}
                          className="flex-row items-center justify-between rounded-full bg-raised px-5 py-3"
                        >
                          <Text className="text-sm text-ink-muted">
                            {t.setLabel} {index + 1}
                          </Text>
                          <Text className="text-base font-semibold text-ink">
                            {set.weight} kg × {set.reps}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                );
              })}

              <View className="flex-row gap-3">
                <Button
                  className="flex-1"
                  variant="secondary"
                  icon="copy-outline"
                  label={t.dupButton}
                  loading={duplicating}
                  onPress={duplicate}
                />
                <Button
                  className="flex-1"
                  variant="secondary"
                  icon="share-outline"
                  label={t.shrCard}
                  disabled={!shareData}
                  onPress={() => setShareVisible(true)}
                />
              </View>
            </>
          )}
        </ScrollView>
      )}
      <ShareCardSheet
        visible={shareVisible}
        data={shareData}
        onClose={() => setShareVisible(false)}
      />
      <NewRecordsSheet
        badges={newBadges}
        visible={newBadges.length > 0}
        onClose={() => setNewBadges([])}
      />
    </View>
  );
}
