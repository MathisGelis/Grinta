import React from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import Glass from "@/components/ui/Glass";
import { useTranslation } from "@/contexts/LanguageContext";

interface GlassSearchBarProps {
  value: string;
  onChangeText: (query: string) => void;
  /** Sans `onAdd`, le bouton + n'est pas affiché. */
  onAdd?: () => void;
  placeholder?: string;
  onFilter?: () => void;
  /** Fond verre avec flou (au lieu d'un simple fond translucide). */
  blur?: boolean;
}

const FILL = withAlpha(WorkoutTheme.backgroundSecondary, 0.92);

function GlassSearchBar({
  value,
  onChangeText,
  onAdd,
  placeholder,
  onFilter,
  blur = false,
}: GlassSearchBarProps) {
  const { t } = useTranslation();

  if (blur) {
    return (
      <View className="flex-row items-center gap-3">
        {onFilter && (
          <PressableScale
            onPress={onFilter}
            accessibilityRole="button"
            halo={false}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          >
            <Glass
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 24 }}
            >
              <Ionicons name="options" size={20} color={WorkoutTheme.text.secondary} />
            </Glass>
          </PressableScale>
        )}
        <Glass className="flex-1 flex-row items-center gap-3 rounded-tile px-4" style={{ height: 48 }}>
          <Ionicons name="search-outline" size={18} color={WorkoutTheme.overlay.glassText} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder ?? t.searchEllipsis}
            placeholderTextColor={WorkoutTheme.overlay.glassText}
            className="flex-1 py-0 text-[15px] text-ink" style={{ height: 48 }}
            autoCorrect={false}
          />
        </Glass>
        {onAdd && (
          <PressableScale
            onPress={onAdd}
            accessibilityRole="button"
            halo={false}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          >
            <Glass
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 24 }}
            >
              <Ionicons name="add" size={24} color={WorkoutTheme.text.secondary} />
            </Glass>
          </PressableScale>
        )}
      </View>
    );
  }

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

      {onAdd && (
      <PressableScale
          onPress={onAdd}
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-glass-border"
          style={{ backgroundColor: FILL }}
        >
          <Ionicons name="add" size={24} color="grey" />
        </PressableScale>
      )}
    </View>
  );
}

export default React.memo(GlassSearchBar);
