import React from "react";
import { View, Text, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WorkoutTheme } from "@/constants/Colors";

import { format } from "@/i18n/translations";
import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutCardHeaderProps {
  title: string;
  onPress: () => void;
  totalExercises?: number;
  totalSets?: number;
}

function WorkoutCardHeader({
  title,
  onPress,
  totalExercises,
  totalSets,
}: WorkoutCardHeaderProps) {
  const { t } = useTranslation();
  const exerciseCount = totalExercises ?? 0;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="w-full flex-row items-center gap-4 p-4 active:opacity-70"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
        <Ionicons name="barbell-outline" size={22} color={WorkoutTheme.accent.purple} />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="text-lg font-semibold text-ink">
          {title}
        </Text>
        <View className="mt-1 flex-row items-center gap-4">
          {exerciseCount > 0 && (
            <Text className="text-sm text-ink-muted">
              {format(t.exercisesCount, { n: exerciseCount })}
            </Text>
          )}
          {totalSets !== undefined && (
            <Text className="text-sm text-ink-muted">
              {format(t.setsCount, { n: totalSets })}
            </Text>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={WorkoutTheme.text.tertiary}
      />
    </Pressable>
  );
}

export default React.memo(WorkoutCardHeader);
