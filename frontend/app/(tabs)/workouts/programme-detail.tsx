import React, { useCallback, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TokenService } from "@/services/token.service";
import {
  getPlannedWorkouts,
  PlannedWorkout,
} from "@/services/workouts.service";
import {
  getTodayProgramme,
  endActiveProgramme,
  getProgrammeById,
  updateProgramme,
  deleteProgramme,
  startProgramme,
  Programm,
  ProgrammeDay,
} from "@/services/programms.service";
import { localDate } from "@/utils/date";
import ProgrammeDayEditor from "@/components/workout/programmes/ProgrammeDayEditor";
import IconButton from "@/components/ui/IconButton";
import StartDateSheet from "@/components/workout/programmes/StartDateSheet";
import WorkoutActionMenu from "@/components/workout/card/WorkoutActionMenu";
import ErrorState from "@/components/ui/ErrorState";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import { difficultyLabel } from "@/i18n/labels";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { DetailSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/components/ui/Toast";

/**
 * Planification à une date future désactivée pour l'instant (le programme en cours serait remplacé
 * immédiatement). Passer à `true` pour rétablir le calendrier de choix de la date de début.
 */

export default function ProgrammeDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useFloatingHeaderHeight();
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>();
  const [programme, setProgramme] = useState<Programm | null>(null);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>([]);
  const [days, setDays] = useState<ProgrammeDay[]>([]);
  const [currentDay, setCurrentDay] = useState<number | undefined>();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const savedDays = useRef("[]");
  const daysKey = (list: ProgrammeDay[]) => JSON.stringify(list.map((d) => d.workout?.id ?? null));

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
      const loadedDays = (fetched.days ?? []).map((day, index) => ({
        dayNumber: index + 1,
        workout: day.workout ?? null,
      }));
      setDays(loadedDays);
      savedDays.current = daysKey(loadedDays);
      setAvailableWorkouts(workouts);
      setIsActive(today?.programme.id === programmeId);
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
    // Rien n'a changé : on quitte simplement le mode modification, sans appel au backend.
    if (daysKey(days) === savedDays.current) {
      setEditing(false);
      return;
    }
    // Un programme ne peut pas n'être fait que de jours de repos (B-22).
    if (!days.some((day) => day.workout)) {
      Alert.alert(t.error, t.apiErrors.PROGRAMME_NEEDS_WORKOUT);
      return;
    }
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
      savedDays.current = daysKey(days);
      setEditing(false);
      toast.success(t.programmeUpdated);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.cannotSaveProfile);
    } finally {
      setSaving(false);
    }
  }, [t, days, programme, programmeId]);

  const handleStart = useCallback(async (startDate: string, startDay = 1) => {
    if (!programmeId) return;
    try {
      setStarting(true);
      const started = await startProgramme(programmeId, startDate, startDay);
      setPickingDate(false);
      setIsActive(true);
      // Début dans le futur : aucun jour n'est « aujourd'hui » pour l'instant.
      setCurrentDay(startDate === localDate() ? started.dayNumber : undefined);
      Alert.alert(t.prgStarted, t.prgStartedMessage);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setStarting(false);
    }
  }, [t, programmeId]);

  const handleEnd = useCallback(() => {
    Alert.alert(t.prgEnd, t.prgEndMessage, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.prgEnd,
        style: "destructive",
        onPress: async () => {
          try {
            await endActiveProgramme();
            setIsActive(false);
            setCurrentDay(undefined);
            toast.success(t.prgEnded);
          } catch (err) {
            Alert.alert(t.error, err instanceof Error ? err.message : t.genericError);
          }
        },
      },
    ]);
  }, [t]);

  const handleCancelEdit = useCallback(() => {
    if (saving) return;
    setEditing(false);
    load();
  }, [saving, load]);

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
      <ScreenHeader
        floating
        title={programme?.title ?? ""}
        backIcon={editing ? "close" : "chevron-back"}
        onBack={editing ? handleCancelEdit : undefined}
        right={
          !programme ? undefined : editing ? (
            <IconButton
              icon="checkmark"
              label={t.save}
              variant="glass"
              className={saving ? "opacity-50" : ""}
              onPress={saving ? undefined : handleSave}
            />
          ) : (
            <IconButton
              icon="ellipsis-horizontal"
              label={t.editLabel}
              variant="glass"
              onPress={() => setMenuOpen((open) => !open)}
            />
          )
        }
      />

      {loading ? (
        <View className="px-5" style={{ paddingTop: headerHeight }}><DetailSkeleton /></View>
      ) : error || !programme ? (
        <View className="px-5" style={{ paddingTop: headerHeight }}>
          <ErrorState
            message={error ?? t.noProgrammeFound}
            onRetry={() => {
              setLoading(true);
              load();
            }}
          />
        </View>
      ) : (
        <ProgrammeDayEditor
            days={days}
            onChangeDays={setDays}
            availableWorkouts={availableWorkouts}
            editing={editing}
            currentDay={currentDay}
          contentContainerStyle={{ paddingTop: headerHeight, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
          header={
            <View style={{ marginBottom: 16 }}>
          <View className="mb-4 gap-1">
            <Text className="text-xl font-semibold text-ink">{programme.title}</Text>
            <Text
              className={`text-sm ${programme.description ? "text-ink-soft" : "text-ink-muted"}`}
            >
              {programme.description || t.noDescription}
            </Text>
          </View>
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
        />
      )}

      <StartDateSheet
        visible={pickingDate}
        loading={starting}
        dayCount={days.length}
        onClose={() => setPickingDate(false)}
        onConfirm={handleStart}
      />

      {menuOpen && !editing ? (
        <WorkoutActionMenu
          onClose={() => setMenuOpen(false)}
          items={[
            { icon: "play-outline", label: t.prgStart, onPress: () => setPickingDate(true) },
            ...(isActive ? [{ icon: "stop-circle-outline" as const, label: t.prgEnd, onPress: handleEnd }] : []),
            { icon: "create-outline", label: t.editLabel, onPress: () => setEditing(true) },
            { icon: "trash-outline", label: t.delete, danger: true, onPress: handleDelete },
          ]}
        />
      ) : null}
    </View>
  );
}
