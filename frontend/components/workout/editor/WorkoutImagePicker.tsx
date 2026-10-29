import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { pickImage } from "@/services/photo.service";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

import { mediaUrl } from "@/services/api";
import IconButton from "@/components/ui/IconButton";
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
  const choose = async () => {
    const uri = await pickImage();
    if (uri) onImageChange(uri);
  };

  return (
    <FormField label={t.photoLabel}>
      <PressableScale
        onPress={choose}
        accessibilityRole="button"
        accessibilityLabel={t.addPhoto}
        className="h-40 overflow-hidden rounded-card bg-surface"
      >
        {image ? (
          <>
            <Image
              source={{ uri: mediaUrl(image) }}
              cachePolicy="disk"
              contentFit="cover"
              className="h-full w-full"
            />
            <View className="absolute right-3 top-3">
              <IconButton
                icon="close"
                variant="glass"
                size={40}
                label={t.removePhoto}
                onPress={() => onImageChange(null)}
              />
            </View>
          </>
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
