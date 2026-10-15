import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SelectList } from "react-native-dropdown-select-list";
import ProgrammeDayEditor from "@/components/workout/programmes/ProgrammeDayEditor";
import { createProgramme, ProgrammeDay } from "@/services/programms.service";
import {
  getPlannedWorkouts,
  getWorkoutById,
  PlannedWorkout,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";

import Button from "@/components/ui/Button";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { FormField, TextField } from "@/components/ui/FormField";
import { selectStyles } from "@/components/ui/selectStyles";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  DIFFICULTY_KEYS,
  LOCATION_KEYS,
  difficultyLabel,
  locationLabel,
} from "@/i18n/labels";
export default function CreateProgrammScreen() {
  const { t } = useTranslation();
  const DIFFICULTY_OPTIONS = DIFFICULTY_KEYS.map((key) => ({
    key,
    value: difficultyLabel(t, key),
  }));
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

      Alert.alert(t.success, t.programmeCreated, [
        { text: "OK", onPress: () => router.back() },
      ]);
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
      <ScreenBackground />
      <ScreenHeader title={t.newProgramme} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-ink-muted">
          {t.programmeIntro}
        </Text>

        <FormField label={t.titleLabel} required>
          <TextField
            value={title}
            onChangeText={setTitle}
            placeholder={t.programmeTitlePlaceholder}
          />
        </FormField>

        <FormField label={t.descriptionLabel}>
          <TextField
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder={t.programmeDescPlaceholder}
          />
        </FormField>

        <FormField label={t.difficultyLabel} required>
          <SelectList
            setSelected={(value: string) => setDifficulty(value)}
            data={DIFFICULTY_OPTIONS}
            save="key"
            search={false}
            placeholder={t.chooseDifficulty}
            defaultOption={DIFFICULTY_OPTIONS.find(
              (option) => option.key === difficulty,
            )}
            {...selectStyles}
          />
        </FormField>

        <FormField label={t.locationLabel} required>
          <SelectList
            setSelected={(value: string) => setLocationType(value)}
            data={LOCATION_OPTIONS}
            save="key"
            search={false}
            placeholder={t.chooseLocation}
            defaultOption={LOCATION_OPTIONS.find(
              (option) => option.key === locationType,
            )}
            {...selectStyles}
          />
        </FormField>

        <ProgrammeDayEditor
          days={days}
          onChangeDays={setDays}
          availableWorkouts={availableWorkouts}
        />

        <Button
          label={t.createProgramme}
          loading={loading}
          onPress={submitProgramme}
        />
      </ScrollView>
    </View>
  );
}
