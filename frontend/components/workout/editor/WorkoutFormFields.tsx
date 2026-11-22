import React from "react";
import { View } from "react-native";
import { OutlinedField } from "@/components/ui/OutlinedField";

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
      <OutlinedField
        label={t.workoutNameLabel}
        required
        placeholder={t.workoutNamePlaceholder}
        value={name}
        maxLength={LIMITS.title}
        onChangeText={onNameChange}
      />

      <OutlinedField
        label={t.descriptionLabel}
        multiline
        placeholder={t.descriptionPlaceholder}
        value={description}
        maxLength={LIMITS.description}
        onChangeText={onDescriptionChange}
      />
    </View>
  );
}
