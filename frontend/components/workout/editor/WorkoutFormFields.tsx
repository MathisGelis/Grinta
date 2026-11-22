import React from "react";
import { View } from "react-native";
import { FormField, TextField } from "@/components/ui/FormField";

import { useTranslation } from "@/contexts/LanguageContext";
import { LIMITS } from "@/utils/validation";
interface WorkoutFormFieldsProps {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
}

export default function WorkoutFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
}: WorkoutFormFieldsProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-5">
      <FormField label={t.workoutNameLabel} required>
        <TextField
          placeholder={t.workoutNamePlaceholder}
          value={name}
          maxLength={LIMITS.title}
          onChangeText={onNameChange}
        />
      </FormField>

      <FormField label={t.descriptionLabel}>
        <TextField
          multiline
          placeholder={t.descriptionPlaceholder}
          value={description}
          maxLength={LIMITS.description}
          onChangeText={onDescriptionChange}
        />
      </FormField>
    </View>
  );
}
