import React from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import WorkoutImagePicker from "./WorkoutImagePicker";

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
  return (
    <>
      {/* Nom */}
      <View className="mt-5">
        <Text className="text-sm font-bold mb-2" style={{ color: WorkoutTheme.text.primary }}>
          Nom de la séance
        </Text>
        <View
          className="flex-row items-center rounded-xl px-3 h-12 border gap-2"
          style={{
            backgroundColor: WorkoutTheme.backgroundSecondary,
            borderColor: WorkoutTheme.border,
          }}
        >
          <Ionicons name="barbell" size={18} color={WorkoutTheme.accent.purple} />
          <TextInput
            placeholder="Ex: Push Day"
            placeholderTextColor={WorkoutTheme.text.tertiary}
            className="flex-1 text-sm"
            style={{ color: WorkoutTheme.text.primary }}
            value={name}
            onChangeText={onNameChange}
          />
        </View>
      </View>

      {/* Description */}
      <View className="mt-5">
        <Text className="text-sm font-bold mb-2" style={{ color: WorkoutTheme.text.primary }}>
          Description
        </Text>
        <TextInput
          placeholder="Objectif, sensations, notes..."
          placeholderTextColor={WorkoutTheme.text.tertiary}
          multiline
          numberOfLines={4}
          className="rounded-xl px-3 pt-3 border text-sm"
          style={{
            color: WorkoutTheme.text.primary,
            backgroundColor: WorkoutTheme.backgroundSecondary,
            borderColor: WorkoutTheme.border,
            height: 100,
            textAlignVertical: "top",
          }}
          value={description}
          onChangeText={onDescriptionChange}
        />
      </View>

      {/* Image */}
      <WorkoutImagePicker image={image} onImageChange={onImageChange} />

      {/* Durée estimée */}
      <View className="mt-5">
        <Text className="text-sm font-bold mb-2" style={{ color: WorkoutTheme.text.primary }}>
          Durée estimée (minutes)
        </Text>
        <View
          className="flex-row items-center rounded-xl px-3 h-12 border gap-2"
          style={{
            backgroundColor: WorkoutTheme.backgroundSecondary,
            borderColor: WorkoutTheme.border,
          }}
        >
          <Ionicons name="time" size={18} color={WorkoutTheme.accent.purple} />
          <TextInput
            placeholder="Ex: 45"
            placeholderTextColor={WorkoutTheme.text.tertiary}
            className="flex-1 text-sm"
            style={{ color: WorkoutTheme.text.primary }}
            value={estimatedTime}
            onChangeText={onEstimatedTimeChange}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text className="text-xs font-semibold" style={{ color: WorkoutTheme.text.secondary }}>
            min
          </Text>
        </View>
      </View>
    </>
  );
}
