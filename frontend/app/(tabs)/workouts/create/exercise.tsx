import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  createExercise,
  getExerciseById,
  updateExercise,
} from "@/services/exercises.service";
import { TokenService } from "@/services/token.service";
import { SelectList } from "react-native-dropdown-select-list";

import { WorkoutTheme } from "@/constants/Colors";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { FormField, TextField } from "@/components/ui/FormField";
import { selectStyles } from "@/components/ui/selectStyles";
import { useTranslation } from "@/contexts/LanguageContext";
export default function CreateExerciseScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const isEditing = !!exerciseId;
  const [ready, setReady] = useState(!exerciseId);
  const [name, setName] = useState("");
  const [equipmentType, setEquipmentType] = useState<string | null>(null);
  const [primaryMuscle, setPrimaryMuscle] = useState<string | null>(null);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [exerciseType, setExerciseType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    getExerciseById(exerciseId)
      .then((exercise) => {
        setName(exercise.name);
        setEquipmentType(exercise.equipment_type);
        setPrimaryMuscle(exercise.primary_muscle);
        setSecondaryMuscles(exercise.secondary_muscles ?? []);
        setExerciseType(exercise.exercise_type);
        setReady(true);
      })
      .catch((error) => {
        Alert.alert(
          t.error,
          error instanceof Error ? error.message : t.loadingError,
          [{ text: "OK", onPress: () => router.back() }],
        );
      });
  }, [exerciseId, t]);

  const toggleSecondaryMuscle = (key: string) =>
    setSecondaryMuscles((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    );

  const handleCreateExercise = async () => {
    if (!name.trim()) {
      Alert.alert(t.error, t.exerciseNameRequired);
      return;
    }
    if (!equipmentType) {
      Alert.alert(t.error, t.equipmentRequired);
      return;
    }
    if (!primaryMuscle) {
      Alert.alert(t.error, t.primaryMuscleRequired);
      return;
    }
    if (!exerciseType) {
      Alert.alert(t.error, t.exerciseTypeRequired);
      return;
    }

    setLoading(true);
    try {
      const token = await TokenService.get();
      if (!token) {
        Alert.alert(t.error, t.authRequired);
        return;
      }

      const secondary = secondaryMuscles.filter((m) => m !== primaryMuscle);
      const exerciseData = {
        name: name.trim(),
        equipment_type: equipmentType,
        primary_muscle: primaryMuscle,
        secondary_muscles:
          secondary.length > 0 || isEditing ? secondary : undefined,
        exercise_type: exerciseType,
      };

      if (exerciseId) {
        await updateExercise(exerciseId, exerciseData, token);
      } else {
        await createExercise(exerciseData, token);
      }
      Alert.alert(
        t.success,
        isEditing ? t.exerciseUpdated : t.exerciseCreated,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.creationError;
      Alert.alert(t.error, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const options = (labels: Record<string, string>) =>
    Object.entries(labels).map(([key, label]) => ({ key, value: label }));

  return (
    <View className="flex-1">
      <ScreenBackground />
      <ScreenHeader title={isEditing ? t.editExercise : t.newExercise} />
      {!ready ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-5 px-5"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          <FormField label={t.name} required>
            <TextField
              placeholder={t.exerciseNamePlaceholder}
              value={name}
              onChangeText={setName}
            />
          </FormField>

          <FormField label={t.equipmentType} required>
            <SelectList
              setSelected={(val: string) => setEquipmentType(val)}
              data={options(t.equipmentNames)}
              save="key"
              search={false}
              defaultOption={
                equipmentType
                  ? {
                      key: equipmentType,
                      value: t.equipmentNames[equipmentType] ?? equipmentType,
                    }
                  : undefined
              }
              placeholder={t.selectEquipment}
              {...selectStyles}
            />
          </FormField>

          <FormField label={t.primaryMuscle} required>
            <SelectList
              setSelected={(val: string) => setPrimaryMuscle(val)}
              data={options(t.muscleNames)}
              save="key"
              search={false}
              defaultOption={
                primaryMuscle
                  ? {
                      key: primaryMuscle,
                      value: t.muscleNames[primaryMuscle] ?? primaryMuscle,
                    }
                  : undefined
              }
              placeholder={t.selectMuscle}
              {...selectStyles}
            />
          </FormField>

          <FormField label={t.secondaryMuscles}>
            <View className="flex-row flex-wrap gap-2">
              {Object.entries(t.muscleNames)
                .filter(([key]) => key !== primaryMuscle)
                .map(([key, label]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={secondaryMuscles.includes(key)}
                    onPress={() => toggleSecondaryMuscle(key)}
                  />
                ))}
            </View>
          </FormField>

          <FormField label={t.exerciseType} required>
            <SelectList
              setSelected={(val: string) => setExerciseType(val)}
              data={options(t.exerciseTypeNames)}
              save="key"
              search={false}
              defaultOption={
                exerciseType
                  ? {
                      key: exerciseType,
                      value: t.exerciseTypeNames[exerciseType] ?? exerciseType,
                    }
                  : undefined
              }
              placeholder={t.selectType}
              {...selectStyles}
            />
          </FormField>

          <Button
            className="mt-3"
            label={isEditing ? t.save : t.createExercise}
            loading={loading}
            onPress={handleCreateExercise}
          />
        </ScrollView>
      )}
    </View>
  );
}
