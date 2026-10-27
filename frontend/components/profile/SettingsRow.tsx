import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  loading?: boolean;
};

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text className="ml-1 text-lg font-semibold text-ink">{title}</Text>
      <View className="gap-2">{children}</View>
    </View>
  );
}

export default function SettingsRow({
  icon,
  label,
  hint,
  onPress,
  right,
  danger,
  loading,
}: Props) {
  const content = (
    <>
      <View
        className={`h-11 w-11 items-center justify-center rounded-full ${
          danger ? "bg-danger-tint" : "bg-accent-tint"
        }`}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? WorkoutTheme.status.danger : WorkoutTheme.accent.purple}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-medium ${danger ? "text-danger" : "text-ink"}`}
        >
          {label}
        </Text>
        {hint ? <Text className="mt-0.5 text-xs text-ink-muted">{hint}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={WorkoutTheme.status.danger} />
      ) : (
        (right ??
        (onPress && !danger ? (
          <Ionicons name="chevron-forward" size={18} color={WorkoutTheme.text.tertiary} />
        ) : null))
      )}
    </>
  );

  const base = "flex-row items-center gap-3 rounded-card bg-surface p-3 pr-5";

  return onPress ? (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={base}
    >
      {content}
    </PressableScale>
  ) : (
    <View className={base}>{content}</View>
  );
}
