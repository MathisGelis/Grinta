import React from "react";
import { View, Text, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

import PressableScale from "@/components/ui/PressableScale";
import { FormField } from "@/components/ui/FormField";
import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutImagePickerProps {
  image: string | null;
  onImageChange: (uri: string | null) => void;
}

export default function WorkoutImagePicker({
  image,
  onImageChange,
}: WorkoutImagePickerProps) {
  const { t } = useTranslation();
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      onImageChange(result.assets[0].uri);
    }
  };

  return (
    <FormField label={t.photoLabel}>
      <PressableScale
        onPress={pickImage}
        accessibilityRole="button"
        accessibilityLabel={t.addPhoto}
        className="h-40 overflow-hidden rounded-card bg-surface"
      >
        {image ? (
          <Image source={{ uri: image }} className="h-full w-full" />
        ) : (
          <View className="h-full w-full items-center justify-center gap-2">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-accent-tint">
              <Ionicons
                name="image-outline"
                size={26}
                color={WorkoutTheme.accent.purple}
              />
            </View>
            <Text className="text-sm font-medium text-ink-soft">
              {t.addPhoto}
            </Text>
          </View>
        )}
      </PressableScale>
    </FormField>
  );
}
