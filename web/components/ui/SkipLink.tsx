import React from "react";
import { Text } from "react-native";
import PressableScale from "./PressableScale";

type Props = { label: string; onPress: () => void; className?: string };

export default function SkipLink({ label, onPress, className = "" }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      className={`self-center px-4 py-2 ${className}`}
    >
      <Text className="text-sm text-ink-muted">{label}</Text>
    </PressableScale>
  );
}
