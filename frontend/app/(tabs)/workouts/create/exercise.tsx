import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { createExercise } from "@/services/exercises.service";
import { TokenService } from "@/services/token.service";
import {
  SelectList,
  MultipleSelectList,
} from "react-native-dropdown-select-list";

import { WorkoutTheme } from "@/constants/Colors";
import Button from "@/components/ui/Button";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { FormField, TextField } from "@/components/ui/FormField";
import { selectStyles } from "@/components/ui/selectStyles";
import { useTranslation } from "@/contexts/LanguageContext";
export default function CreateExerciseScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [equipmentType, setEquipmentType] = useState<string | null>(null);
  const [primaryMuscle, setPrimaryMuscle] = useState<string | null>(null);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [exerciseType, setExerciseType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      const exerciseData = {
        name: name.trim(),
        equipment_type: equipmentType,
        primary_muscle: primaryMuscle,
        secondary_muscles:
          secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
        exercise_type: exerciseType,
      };

      await createExercise(exerciseData, token);
      Alert.alert(t.success, t.exerciseCreated, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
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
      <ScreenHeader title={t.newExercise} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 px-5 pb-10"
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
            placeholder={t.selectMuscle}
            {...selectStyles}
          />
        </FormField>

        <FormField label={t.secondaryMuscles}>
          <MultipleSelectList
            setSelected={setSecondaryMuscles}
            data={options(t.muscleNames)}
            save="key"
            search={false}
            placeholder={t.selectMuscles}
            label={t.selectedLabel}
            {...selectStyles}
            badgeStyles={{ backgroundColor: WorkoutTheme.accent.purple }}
            labelStyles={{ color: WorkoutTheme.text.secondary }}
            checkBoxStyles={{ borderColor: WorkoutTheme.border }}
            disabledCheckBoxStyles={{ borderColor: WorkoutTheme.text.disabled }}
          />
        </FormField>

        <FormField label={t.exerciseType} required>
          <SelectList
            setSelected={(val: string) => setExerciseType(val)}
            data={options(t.exerciseTypeNames)}
            save="key"
            search={false}
            placeholder={t.selectType}
            {...selectStyles}
          />
        </FormField>

        <Button
          className="mt-3"
          label={t.createExercise}
          loading={loading}
          onPress={handleCreateExercise}
        />
      </ScrollView>
    </View>
  );
}
