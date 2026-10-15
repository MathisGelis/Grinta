import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import IconButton from "@/components/ui/IconButton";
import Glass from "@/components/ui/Glass";
import PressableScale from "@/components/ui/PressableScale";

interface WorkoutSessionHeaderProps {
  workoutTitle: string;
  totalTime: number;
  onMinimize: () => void;
  onEndWorkout: () => void;
}

export default function WorkoutSessionHeader({
  workoutTitle,
  totalTime,
  onMinimize,
  onEndWorkout,
}: WorkoutSessionHeaderProps) {
  const { t } = useTranslation();
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View className="gap-5 px-5 pb-2 pt-3">
      <View className="flex-row items-center justify-between">
        <IconButton
          icon="chevron-down"
          variant="glass"
          label={t.minimizeLabel}
          onPress={onMinimize}
        />
        <View className="mx-3 flex-1 items-center">
          <Text className="text-xs text-ink-muted">{t.workoutInProgress}</Text>
          <Text
            className="mt-0.5 text-base font-semibold text-ink"
            numberOfLines={1}
          >
            {workoutTitle}
          </Text>
        </View>
        <PressableScale
          onPress={onEndWorkout}
          accessibilityRole="button"
          accessibilityLabel={t.finishWorkout}
          style={{ width: 44, height: 44, borderRadius: 22 }}
        >
          <Glass
            className="items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 22 }}
          >
            <Ionicons
              name="stop"
              size={18}
              color={WorkoutTheme.status.warning}
            />
          </Glass>
        </PressableScale>
      </View>

      <Text
        className="text-center text-[56px] font-semibold text-ink"
        style={{ fontVariant: ["tabular-nums"], letterSpacing: -1 }}
      >
        {formatTime(totalTime)}
      </Text>
    </View>
  );
}
