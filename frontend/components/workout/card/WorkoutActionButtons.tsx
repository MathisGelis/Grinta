import React from "react";
import { View } from "react-native";
import Button from "@/components/ui/Button";

import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutActionButtonsProps {
  isEditing: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function WorkoutActionButtons({
  isEditing,
  hasChanges,
  isSaving,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: WorkoutActionButtonsProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-4 w-full flex-row gap-3">
      {!isEditing ? (
        <>
          <Button
            className="flex-1"
            icon="pencil"
            label={t.editLabel}
            onPress={onEdit}
          />
          <Button
            className="flex-1"
            variant="danger"
            icon="trash"
            label={t.delete}
            onPress={onDelete}
          />
        </>
      ) : (
        <>
          <Button
            className="flex-1"
            icon="checkmark"
            label={t.save}
            loading={isSaving}
            disabled={!hasChanges}
            onPress={onSave}
          />
          <Button
            className="flex-1"
            variant="secondary"
            icon="close"
            label={t.cancel}
            disabled={isSaving}
            onPress={onCancel}
          />
        </>
      )}
    </View>
  );
}
