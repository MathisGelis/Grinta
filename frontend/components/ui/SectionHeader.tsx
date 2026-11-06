import React from "react";
import { Text, View } from "react-native";

import PressableScale from "./PressableScale";
type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Élément à droite du titre (ex. bouton loupe). */
  right?: React.ReactNode;
};

export default function SectionHeader({
  title,
  actionLabel,
  onAction,
  className = "",
  right,
}: Props) {
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <Text className="text-xl font-semibold text-ink">{title}</Text>
      <View className="flex-row items-center gap-3">
        {actionLabel && onAction ? (
          <PressableScale
            onPress={onAction}
            accessibilityRole="link"
            className="min-h-[44px] justify-center"
          >
            <Text className="text-sm font-medium text-accent-light">{actionLabel}</Text>
          </PressableScale>
        ) : null}
        {right}
      </View>
    </View>
  );
}
