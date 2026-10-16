import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "./PressableScale";
import Glass from "./Glass";
import { WorkoutTheme } from "@/constants/Colors";

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  label: string;
  variant?: "surface" | "glass" | "accent";
  size?: number;
  halo?: boolean;
  className?: string;
};

export default function IconButton({
  icon,
  onPress,
  label,
  variant = "surface",
  size = 44,
  halo = true,
  className = "",
}: IconButtonProps) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  const glyph = (
    <Ionicons
      name={icon}
      size={size >= 52 ? 24 : 20}
      color={WorkoutTheme.text.primary}
    />
  );
  return (
    <PressableScale
      onPress={onPress}
      halo={halo ? "fill" : false}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={dim}
      className={className}
    >
      {variant === "glass" ? (
        <Glass className="items-center justify-center" style={dim}>
          {glyph}
        </Glass>
      ) : (
        <View
          style={dim}
          className={`items-center justify-center ${variant === "accent" ? "bg-accent" : "bg-surface"}`}
        >
          {glyph}
        </View>
      )}
    </PressableScale>
  );
}
