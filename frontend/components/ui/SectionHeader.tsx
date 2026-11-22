import React, { useState } from "react";
import { Text, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "./PressableScale";
type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Élément à droite du titre (ex. bouton loupe). */
  right?: React.ReactNode;
  /** Explication affichée sous le titre en touchant l'icône « ? ». */
  help?: string;
};

export default function SectionHeader({
  title,
  actionLabel,
  onAction,
  className = "",
  right,
  help,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <View className="gap-2">
    <View className={`flex-row items-center justify-between ${className}`}>
      <View className="flex-1 flex-row items-center gap-2">
        <Text className="text-xl font-semibold text-ink">{title}</Text>
        {help ? (
          <PressableScale
            halo={false}
            hitSlop={10}
            onPress={() => setHelpOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ expanded: helpOpen }}
          >
            <Ionicons
              name={helpOpen ? "help-circle" : "help-circle-outline"}
              size={20}
              color={helpOpen ? WorkoutTheme.accent.purple : WorkoutTheme.text.tertiary}
            />
          </PressableScale>
        ) : null}
      </View>
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
      {help && helpOpen ? <Text className="text-sm leading-5 text-ink-muted">{help}</Text> : null}
    </View>
  );
}
