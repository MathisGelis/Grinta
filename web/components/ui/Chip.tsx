import React from "react";
import { Text, View } from "react-native";
import PressableScale from "./PressableScale";

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
  className?: string;
};

export default function Chip({
  label,
  active,
  onPress,
  count,
  className = "",
}: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      className={`h-10 flex-row items-center justify-center gap-1.5 rounded-full px-5 ${active ? "bg-accent" : "bg-raised"} ${className}`}
    >
      <Text
        className={`text-sm font-medium ${active ? "text-ink" : "text-ink-soft"}`}
      >
        {label}
      </Text>
      {count != null && (
        <View className="-mt-1.5">
          <Text className={`text-[11px] ${active ? "text-ink" : "text-ink-muted"}`}>
            {count}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
