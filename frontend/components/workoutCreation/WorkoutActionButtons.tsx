import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

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
  return (
    <View style={styles.actionButtonsRow}>
      {!isEditing ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons
              name="pencil"
              size={16}
              color={WorkoutTheme.text.primary}
            />
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Ionicons
              name="trash"
              size={16}
              color={WorkoutTheme.text.primary}
            />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.saveButton, !hasChanges && styles.disabledButton]}
            onPress={onSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator
                size="small"
                color={WorkoutTheme.text.primary}
              />
            ) : (
              <View style={styles.saveButtonContent}>
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={WorkoutTheme.text.primary}
                />
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isSaving}
          >
            <Ionicons
              name="close"
              size={16}
              color={WorkoutTheme.text.primary}
            />
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsRow: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    width: "100%",
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.accent.purple,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.status.danger,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.status.success,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButtonText: {
    color: WorkoutTheme.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WorkoutTheme.backgroundTertiary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: WorkoutTheme.border,
  },
  cancelButtonText: {
    color: WorkoutTheme.text.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
