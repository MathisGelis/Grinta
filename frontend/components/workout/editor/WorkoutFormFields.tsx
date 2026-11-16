import React from "react";
import { View } from "react-native";
import { FormField, TextField } from "@/components/ui/FormField";
import DurationPicker from "@/components/ui/DurationPicker";

import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutFormFieldsProps {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  estimatedTime: string;
  onEstimatedTimeChange: (v: string) => void;
}

export default function WorkoutFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  estimatedTime,
  onEstimatedTimeChange,
}: WorkoutFormFieldsProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-5">
      <FormField label={t.workoutNameLabel} required>
        <TextField
          placeholder={t.workoutNamePlaceholder}
          value={name}
          onChangeText={onNameChange}
        />
      </FormField>

      <FormField label={t.descriptionLabel}>
        <TextField
          multiline
          placeholder={t.descriptionPlaceholder}
          value={description}
          onChangeText={onDescriptionChange}
        />
      </FormField>

      <DurationPicker
        label={t.estimatedDuration}
        value={estimatedTime}
        onChange={onEstimatedTimeChange}
      />
    </View>
  );
}
