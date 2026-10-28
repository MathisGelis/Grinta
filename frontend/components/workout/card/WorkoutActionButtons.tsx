import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";

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
  const saveDisabled = !hasChanges || isSaving;

  return (
    <View className="flex-row items-center gap-2">
      {!isEditing ? (
        <>
          <PressableScale
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={t.editLabel}
            className="h-10 w-10 items-center justify-center rounded-full bg-raised"
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={WorkoutTheme.text.primary}
            />
          </PressableScale>
          <PressableScale
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={t.delete}
            className="h-10 w-10 items-center justify-center rounded-full bg-danger-tint"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={WorkoutTheme.status.danger}
            />
          </PressableScale>
        </>
      ) : (
        <>
          <PressableScale
            onPress={isSaving ? undefined : onCancel}
            accessibilityRole="button"
            accessibilityLabel={t.cancel}
            className={`h-10 w-10 items-center justify-center rounded-full bg-raised ${isSaving ? "opacity-50" : ""}`}
          >
            <Ionicons
              name="close"
              size={18}
              color={WorkoutTheme.text.primary}
            />
          </PressableScale>
          <PressableScale
            onPress={saveDisabled ? undefined : onSave}
            accessibilityRole="button"
            accessibilityLabel={t.save}
            accessibilityState={{ disabled: saveDisabled }}
            className={`h-10 w-10 items-center justify-center rounded-full bg-accent ${saveDisabled ? "opacity-50" : ""}`}
          >
            <Ionicons
              name="checkmark"
              size={18}
              color={WorkoutTheme.text.primary}
            />
          </PressableScale>
        </>
      )}
    </View>
  );
}
