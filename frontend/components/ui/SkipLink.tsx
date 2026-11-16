import React from "react";
import { Text } from "react-native";
import PressableScale from "./PressableScale";

type Props = { label: string; onPress: () => void; className?: string; textClassName?: string };

export default function SkipLink({ label, onPress, className = "", textClassName = "text-ink-muted" }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      className={`self-center px-4 py-4 ${className}`}
    >
      <Text className={`text-sm ${textClassName}`}>{label}</Text>
    </PressableScale>
  );
}
