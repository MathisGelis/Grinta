import React from "react";
import { ActivityIndicator, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "./PressableScale";
import { WorkoutTheme } from "@/constants/Colors";

type Variant = "primary" | "secondary" | "dark" | "danger";

const BG: Record<Variant, string> = {
  primary: "bg-accent",
  secondary: "bg-raised",
  dark: "bg-background",
  danger: "bg-danger-tint",
};
const FG: Record<Variant, string> = {
  primary: "text-on-accent",
  secondary: "text-ink",
  dark: "text-ink",
  danger: "text-danger",
};

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  className = "",
}: ButtonProps) {
  const off = disabled || loading;
  return (
    <PressableScale
      haptic
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off }}
      className={`h-[52px] flex-row items-center justify-center gap-2 rounded-full px-6 ${BG[variant]} ${off ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={WorkoutTheme.text.primary} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={
                variant === "danger"
                  ? WorkoutTheme.status.danger
                  : variant === "primary"
                    ? WorkoutTheme.text.onAccent
                    : WorkoutTheme.text.primary
              }
            />
          )}
          <Text className={`text-base font-semibold ${FG[variant]}`}>
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}
