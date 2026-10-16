import React from "react";
import { View, TextInput } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
interface GlassSearchBarProps {
  items: string[];
  onResults: (filtered: string[]) => void;
  onAdd: () => void;
  placeholder?: string;
  filter?: () => void;
}

export default function GlassSearchBar({
  items,
  onResults,
  onAdd,
  placeholder,
  filter,
}: GlassSearchBarProps) {
  const { t } = useTranslation();
  const handleSearch = (query: string) => {
    const filtered = items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
    onResults(filtered);
  };

  return (
    <View className="flex-row gap-3 items-center">
      {filter && (
        <BlurView
          intensity={60}
          tint="dark"
          className="w-12 h-12 rounded-full overflow-hidden items-center justify-center border border-glass-border"
          
        >
          <View
            className="absolute inset-0 bg-glass-fill"
            
          />
          <PressableScale onPress={filter}>
            <Ionicons name="options" size={20} color="grey" />
          </PressableScale>
        </BlurView>
      )}
      <BlurView
        intensity={60}
        tint="dark"
        className="flex-1 flex-row items-center gap-3 px-4 rounded-tile overflow-hidden border border-glass-border"
        
      >
        <View
          className="absolute inset-0 bg-glass-fill"
          
        />
        <Ionicons
          name="search-outline"
          size={18}
          color={WorkoutTheme.overlay.glassText}
        />
        <TextInput
          placeholder={placeholder ?? t.searchEllipsis}
          placeholderTextColor={WorkoutTheme.overlay.glassText}
          className="flex-1 py-3 text-ink text-[15px]"
          onChangeText={handleSearch}
        />
      </BlurView>

      <BlurView
        intensity={60}
        tint="dark"
        className="w-12 h-12 rounded-full overflow-hidden items-center justify-center border border-glass-border"
        
      >
        <View
          className="absolute inset-0 bg-glass-fill"
          
        />
        <PressableScale
          className="w-full h-full items-center justify-center"
          onPress={onAdd}
        >
          <Ionicons name="add" size={24} color="grey" />
        </PressableScale>
      </BlurView>
    </View>
  );
}
