import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import Card from "@/components/ui/Card";
import PressableScale from "@/components/ui/PressableScale";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

/** Petite section affichée sous un titre quand sa liste est vide. */
export default function EmptyHint({ icon, message, actionLabel, onAction }: Props) {
  return (
    <Card size="tile" className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
        <Ionicons name={icon} size={18} color={WorkoutTheme.accent.purple} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-sm text-ink-soft">{message}</Text>
        <PressableScale accessibilityRole="button" onPress={onAction} hitSlop={8} halo={false}>
          <Text className="text-sm font-semibold text-accent-light">{actionLabel}</Text>
        </PressableScale>
      </View>
    </Card>
  );
}
