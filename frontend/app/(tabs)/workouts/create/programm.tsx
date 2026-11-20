import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import ProgrammeDayEditor from "@/components/workout/programmes/ProgrammeDayEditor";
import { createProgramme, ProgrammeDay } from "@/services/programms.service";
import {
  getPlannedWorkouts,
  getWorkoutById,
  PlannedWorkout,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";

import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import { OutlinedField } from "@/components/ui/OutlinedField";
import DifficultyPicker from "@/components/ui/DifficultyPicker";
import LocationPicker from "@/components/ui/LocationPicker";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  DIFFICULTY_KEYS,
  LOCATION_KEYS,
  difficultyLabel,
  locationLabel,
} from "@/i18n/labels";
import { toast } from "@/components/ui/Toast";
import { LIMITS } from "@/utils/validation";
export default function CreateProgrammScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useFloatingHeaderHeight();
  const LOCATION_OPTIONS = LOCATION_KEYS.map((key) => ({
    key,
    value: locationLabel(t, key),
  }));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [locationType, setLocationType] = useState("GYM");
  const [days, setDays] = useState<ProgrammeDay[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const loadWorkouts = useCallback(async () => {
    try {
      const token = await TokenService.get();
      const plannedWorkouts = await getPlannedWorkouts(token || undefined);

      const enrichedWorkouts = await Promise.all(
        plannedWorkouts.map(async (workout) => {
          try {
            const detail = await getWorkoutById(workout.id, token || undefined);
            return {
              id: detail.id,
              title: detail.title,
              description: detail.description,
              totalExercises: detail.totalExercises,
            };
          } catch {
            return workout;
          }
        }),
      );

      setAvailableWorkouts(enrichedWorkouts);
    } catch (error) {
      console.error("Erreur chargement workouts", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  const submitProgramme = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(t.error, t.programmeTitleRequired);
      return;
    }

    if (days.length === 0) {
      Alert.alert(t.error, t.addAtLeastOneDay);
      return;
    }
    // Un programme ne peut pas n'être fait que de jours de repos (B-22).
    if (!days.some((day) => day.workout)) {
      Alert.alert(t.error, t.apiErrors.PROGRAMME_NEEDS_WORKOUT);
      return;
    }

    setLoading(true);

    try {
      await createProgramme({
        weekNumber: 1,
        difficulty,
        locationType,
        title: title.trim(),
        description: description.trim() || undefined,
        days: days.map((day, index) => ({
          dayNumber: index + 1,
          workoutId: day.workout?.id ?? "",
        })),
      });

      toast.success(t.programmeCreated);
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t.creationError;
      Alert.alert(t.error, message);
    } finally {
      setLoading(false);
    }
  }, [t, days, description, difficulty, locationType, title]);

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader
        floating
        title={t.newProgramme}
        right={
          <IconButton
            icon={loading ? "hourglass-outline" : "checkmark"}
            variant="accent"
            label={t.createProgramme}
            onPress={loading ? undefined : submitProgramme}
          />
        }
      />
      <ProgrammeDayEditor
        days={days}
        onChangeDays={setDays}
        availableWorkouts={availableWorkouts}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: headerHeight, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        header={
          <View style={{ gap: 20, marginBottom: 20 }}>
        <Text className="text-sm text-ink-muted">
          {t.programmeIntro}
        </Text>

        <Button
          label={t.imEntry}
          variant="secondary"
          icon="document-text-outline"
          onPress={() => router.push("/(tabs)/workouts/import" as any)}
        />

        <OutlinedField
          label={t.titleLabel}
          required
          value={title}
          maxLength={LIMITS.title}
          onChangeText={setTitle}
          placeholder={t.programmeTitlePlaceholder}
        />

        <OutlinedField
          label={t.descriptionLabel}
          multiline
          value={description}
          maxLength={LIMITS.description}
          onChangeText={setDescription}
          placeholder={t.programmeDescPlaceholder}
        />

        <View className="flex-row gap-3">
        <View className="flex-1">
        <DifficultyPicker
          label={t.difficultyLabel}
          level={Math.max(1, DIFFICULTY_KEYS.indexOf(difficulty as any) + 1)}
          levelLabel={difficultyLabel(t, difficulty)}
          onChange={(level) => setDifficulty(DIFFICULTY_KEYS[level - 1])}
        />
        </View>

        <View className="flex-1">
        <LocationPicker
          label={t.locationLabel}
          required
          options={LOCATION_OPTIONS.map((o) => ({ key: o.key, label: o.value }))}
          value={locationType}
          onChange={setLocationType}
        />
        </View>
        </View>

          </View>
        }
      />
    </View>
  );
}
