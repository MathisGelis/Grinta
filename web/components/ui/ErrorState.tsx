import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";

type Props = {
  onRetry: () => void;
  message?: string;
  className?: string;
};

export default function ErrorState({ onRetry, message, className = "" }: Props) {
  const { t } = useTranslation();
  return (
    <View className={`items-center gap-3 rounded-card bg-surface p-8 ${className}`}>
      <Ionicons name="cloud-offline-outline" size={40} color={WorkoutTheme.text.tertiary} />
      <Text className="text-center text-base font-semibold text-ink">{t.loadFailedTitle}</Text>
      <Text className="text-center text-sm text-ink-muted">{message ?? t.loadingError}</Text>
      <Button icon="refresh" label={t.retryBtn} onPress={onRetry} className="mt-2 self-stretch" />
    </View>
  );
}
