import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

interface WorkoutImagePickerProps {
  image: string | null;
  onImageChange: (uri: string | null) => void;
}

export default function WorkoutImagePicker({
  image,
  onImageChange,
}: WorkoutImagePickerProps) {
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
    <View className="mt-5">
      <Text className="text-sm font-bold mb-2" style={{ color: WorkoutTheme.text.primary }}>
        Photo
      </Text>
      <TouchableOpacity
        onPress={pickImage}
        className="rounded-xl overflow-hidden h-40 border-2 border-dashed"
        style={{
          backgroundColor: WorkoutTheme.backgroundSecondary,
          borderColor: WorkoutTheme.border,
        }}
      >
        {image ? (
          <Image source={{ uri: image }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full justify-center items-center gap-2">
            <Ionicons name="image-outline" size={40} color={WorkoutTheme.accent.purple} />
            <Text className="text-sm font-medium" style={{ color: WorkoutTheme.text.secondary }}>
              Ajouter une photo
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
