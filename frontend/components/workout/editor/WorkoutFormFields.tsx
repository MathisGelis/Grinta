import React from "react";
import { FormField, TextField } from "@/components/ui/FormField";
import WorkoutImagePicker from "@/components/workout/editor/WorkoutImagePicker";

import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutFormFieldsProps {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  image: string | null;
  onImageChange: (uri: string | null) => void;
  estimatedTime: string;
  onEstimatedTimeChange: (v: string) => void;
}

export default function WorkoutFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  image,
  onImageChange,
  estimatedTime,
  onEstimatedTimeChange,
}: WorkoutFormFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <FormField label={t.workoutNameLabel} required>
        <TextField
          icon="barbell"
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

      <WorkoutImagePicker image={image} onImageChange={onImageChange} />

      <FormField label={t.estimatedDuration}>
        <TextField
          icon="time"
          suffix="min"
          placeholder="45"
          value={estimatedTime}
          onChangeText={onEstimatedTimeChange}
          keyboardType="number-pad"
          maxLength={3}
        />
      </FormField>
    </>
  );
}
