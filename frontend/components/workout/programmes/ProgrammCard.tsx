import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TokenService } from "@/services/token.service";
import {
  getPlannedWorkouts,
  PlannedWorkout,
} from "@/services/workouts.service";
import {
  getProgrammeById,
  SmallProgramm,
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
import { difficultyLabel } from "@/i18n/labels";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
interface ProgrammCardProps {
  program: SmallProgramm;
  onUpdate?: (updated: SmallProgramm) => void;
  onDelete?: (id: string) => void;
}

function ProgrammCard({
  program,
  onUpdate,
  onDelete,
}: ProgrammCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [days, setDays] = useState<ProgrammeDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [fullProgram, setFullProgram] = useState<Programm | null>(null);

  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    try {
      setLoading(true);

      const [fetchedProgram, workouts] = await Promise.all([
        getProgrammeById(program.id),
        TokenService.get().then((token) =>
          getPlannedWorkouts(token || undefined),
        ),
      ]);

      setFullProgram(fetchedProgram);
      setDays(
        (fetchedProgram.days ?? []).map((day, index) => ({
          dayNumber: index + 1,
          workout: day.workout ?? null,
        })),
      );

      setAvailableWorkouts(workouts);
      setIsExpanded(true);
    } catch (error) {
      console.error("Erreur chargement programme", error);
      Alert.alert(t.error, t.cannotLoadProgramme);
    } finally {
      setLoading(false);
    }
  }, [t, isExpanded, program.id]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const updated = await updateProgramme(program.id, {
        weekNumber: fullProgram?.weekNumber ?? 1,
        difficulty: fullProgram?.difficulty ?? "BEGINNER",
        locationType: fullProgram?.locationType ?? "ANY",
        title: fullProgram?.title ?? program.title,
        description: fullProgram?.description,
        days: days.map((day) => ({
          dayNumber: day.dayNumber,
          workoutId: day.workout?.id ?? null,
        })),
      });

      if (onUpdate) onUpdate({ ...program, ...updated });
      Alert.alert(t.success, t.programmeUpdated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t.cannotSaveProfile;
      Alert.alert(t.error, message);
    } finally {
      setSaving(false);
    }
  }, [t, days, onUpdate, program, fullProgram]);

  const handleStart = useCallback(async () => {
    try {
      setStarting(true);
      await startProgramme(program.id, localDate());
      Alert.alert(t.prgStarted, t.prgStartedMessage);
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : t.loadingError);
    } finally {
      setStarting(false);
    }
  }, [t, program.id]);

  const handleDelete = useCallback(() => {
    Alert.alert(t.confirmDeletion, t.deleteProgrammeConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProgramme(program.id);
            onDelete?.(program.id);
          } catch (error) {
            Alert.alert(t.error, t.cannotDeleteProgramme);
            console.error("Erreur suppression programme", error);
          }
        },
      },
    ]);
  }, [t, onDelete, program.id]);

  return (
    <View className="mb-3 rounded-card bg-surface p-5">
      <Pressable
        onPress={handleExpand}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={program.title}
        className="gap-4 active:opacity-70"
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className="flex-1 text-xl font-semibold text-ink"
            numberOfLines={2}
          >
            {program.title}
          </Text>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-raised">
            {loading ? (
              <ActivityIndicator
                size="small"
                color={WorkoutTheme.accent.purple}
              />
            ) : (
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={WorkoutTheme.text.primary}
              />
            )}
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <View className="h-8 justify-center rounded-full bg-accent-tint px-3">
            <Text className="text-xs font-medium text-accent-text">
              {difficultyLabel(t, program.difficulty)}
            </Text>
          </View>
          <View className="h-8 justify-center rounded-full bg-raised px-3">
            <Text className="text-xs font-medium text-ink-light">
              {format(t.daysCount, { n: program.totalDays })}
            </Text>
          </View>
          <View className="h-8 justify-center rounded-full bg-raised px-3">
            <Text className="text-xs font-medium text-ink-light">
              {format(t.workoutsCountLabel, { n: program.workoutDays })}
            </Text>
          </View>
        </View>
      </Pressable>

      {isExpanded && (
        <View className="mt-4 gap-3">
          <ProgrammeDayEditor
            days={days}
            onChangeDays={setDays}
            availableWorkouts={availableWorkouts}
          />

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
      )}
    </View>
  );
}

export default React.memo(ProgrammCard);
