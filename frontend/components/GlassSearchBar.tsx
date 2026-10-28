import React from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";

interface GlassSearchBarProps {
  value: string;
  onChangeText: (query: string) => void;
  onAdd: () => void;
  placeholder?: string;
  onFilter?: () => void;
}

const FILL = withAlpha(WorkoutTheme.backgroundSecondary, 0.92);

function GlassSearchBar({
  value,
  onChangeText,
  onAdd,
  placeholder,
  onFilter,
}: GlassSearchBarProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-3">
      {onFilter && (
        <PressableScale
          onPress={onFilter}
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-glass-border"
          style={{ backgroundColor: FILL }}
        >
          <Ionicons name="options" size={20} color="grey" />
        </PressableScale>
      )}

      <View
        className="flex-1 flex-row items-center gap-3 overflow-hidden rounded-tile border border-glass-border px-4"
        style={{ backgroundColor: FILL }}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={WorkoutTheme.overlay.glassText}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? t.searchEllipsis}
          placeholderTextColor={WorkoutTheme.overlay.glassText}
          className="flex-1 py-3 text-[15px] text-ink"
          autoCorrect={false}
        />
      </View>

      <PressableScale
        onPress={onAdd}
        accessibilityRole="button"
        className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-glass-border"
        style={{ backgroundColor: FILL }}
      >
        <Ionicons name="add" size={24} color="grey" />
      </PressableScale>
    </View>
  );
}

export default React.memo(GlassSearchBar);
