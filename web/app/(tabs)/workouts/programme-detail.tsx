import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TokenService } from "@/services/token.service";
import {
  getPlannedWorkouts,
  PlannedWorkout,
} from "@/services/workouts.service";
import {
  getTodayProgramme,
  getProgrammeById,
  updateProgramme,
  deleteProgramme,
  startProgramme,
  Programm,
  ProgrammeDay,
} from "@/services/programms.service";
import { localDate } from "@/utils/date";
import ProgrammeDayEditor from "@/components/workout/programmes/ProgrammeDayEditor";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import Button from "@/components/ui/Button";
import { difficultyLabel } from "@/i18n/labels";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";

export default function ProgrammeDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>();
  const [programme, setProgramme] = useState<Programm | null>(null);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>([]);
  const [days, setDays] = useState<ProgrammeDay[]>([]);
  const [currentDay, setCurrentDay] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    if (!programmeId) return;
    try {
      setError(null);
      const [fetched, workouts, today] = await Promise.all([
        getProgrammeById(programmeId),
        TokenService.get().then((token) => getPlannedWorkouts(token || undefined)),
        getTodayProgramme(localDate()).catch(() => null),
      ]);
      setProgramme(fetched);
      setDays(
        (fetched.days ?? []).map((day, index) => ({
          dayNumber: index + 1,
          workout: day.workout ?? null,
        })),
      );
      setAvailableWorkouts(workouts);
      setCurrentDay(
        today?.programme.id === programmeId ? today.dayNumber : undefined,
      );
    } catch (err) {
      console.error("Erreur chargement programme", err);
      setError(t.cannotLoadProgramme);
    } finally {
      setLoading(false);
    }
  }, [programmeId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSave = useCallback(async () => {
    if (!programmeId || !programme) return;
    try {
      setSaving(true);
      await updateProgramme(programmeId, {
        weekNumber: programme.weekNumber ?? 1,
        difficulty: programme.difficulty ?? "BEGINNER",
        locationType: programme.locationType ?? "ANY",
        title: programme.title,
        description: programme.description,
        days: days.map((day) => ({
          dayNumber: day.dayNumber,
          workoutId: day.workout?.id ?? null,
        })),
      });
      Alert.alert(t.success, t.programmeUpdated);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.cannotSaveProfile);
    } finally {
      setSaving(false);
    }
  }, [t, days, programme, programmeId]);

  const handleStart = useCallback(async () => {
    if (!programmeId) return;
    try {
      setStarting(true);
      const started = await startProgramme(programmeId, localDate());
      setCurrentDay(started.dayNumber);
      Alert.alert(t.prgStarted, t.prgStartedMessage);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setStarting(false);
    }
  }, [t, programmeId]);

  const handleDelete = useCallback(() => {
    if (!programmeId) return;
    Alert.alert(t.confirmDeletion, t.deleteProgrammeConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProgramme(programmeId);
            router.back();
          } catch (err) {
            Alert.alert(t.error, t.cannotDeleteProgramme);
            console.error("Erreur suppression programme", err);
          }
        },
      },
    ]);
  }, [t, programmeId]);

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader title={programme?.title ?? ""} />

      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : error || !programme ? (
        <View className="items-center px-5">
          <Text className="text-danger">{error ?? t.noProgrammeFound}</Text>
        </View>
      ) : (
        <ProgrammeDayEditor
            days={days}
            onChangeDays={setDays}
            availableWorkouts={availableWorkouts}
            currentDay={currentDay}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
          header={
            <View style={{ marginBottom: 16 }}>
          <View className="flex-row flex-wrap gap-2">
            <View className="h-8 justify-center rounded-full bg-accent-tint px-3">
              <Text className="text-xs font-medium text-accent-text">
                {difficultyLabel(t, programme.difficulty)}
              </Text>
            </View>
            <View className="h-8 justify-center rounded-full bg-raised px-3">
              <Text className="text-xs font-medium text-ink-light">
                {format(t.daysCount, { n: days.length })}
              </Text>
            </View>
            <View className="h-8 justify-center rounded-full bg-raised px-3">
              <Text className="text-xs font-medium text-ink-light">
                {format(t.workoutsCountLabel, {
                  n: days.filter((d) => d.workout).length,
                })}
              </Text>
            </View>
          </View>

            </View>
          }
          footer={
            <View style={{ gap: 16, marginTop: 12 }}>
          <Button
            variant="secondary"
            icon="play-outline"
            label={t.prgStart}
            loading={starting}
            onPress={handleStart}
          />

          <View className="w-full flex-row items-center gap-3">
            <Button
              className="flex-1"
              label={t.saveDays}
              loading={saving}
              onPress={handleSave}
            />
            <PressableScale
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel={t.deleteProgramme}
              className="h-[52px] w-[52px] items-center justify-center rounded-full bg-danger-tint"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={WorkoutTheme.status.danger}
              />
            </PressableScale>
          </View>
            </View>
          }
        />
      )}
    </View>
  );
}
