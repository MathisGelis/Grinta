import React from "react";
import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Button from "./Button";
import { WorkoutTheme } from "@/constants/Colors";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Sans fond ni arrondi : à utiliser dans une feuille ou une carte qui a déjà le sien. */
  plain?: boolean;
  className?: string;
};

/** État vide d'une liste ou d'un écran : pastille d'icône, titre, indication et action facultative. */
export default function EmptyState({ icon, title, message, actionLabel, onAction, plain, className = "" }: Props) {
  return (
    <View className={`items-center gap-3 ${plain ? "py-6" : "rounded-card bg-surface p-8"} ${className}`}>
      <View className="h-16 w-16 items-center justify-center rounded-full bg-accent-tint">
        <Ionicons name={icon} size={28} color={WorkoutTheme.accent.purple} />
      </View>
      <Text className="text-center text-base font-semibold text-ink">{title}</Text>
      {message ? <Text className="text-center text-sm text-ink-muted">{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} className="mt-2 self-stretch" />
      ) : null}
    </View>
  );
}
