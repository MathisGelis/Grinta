import React from "react";
import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & {
  size?: "hero" | "card" | "tile";
  tone?: "surface" | "raised" | "accent" | "accentTint";
  className?: string;
};

const TONE = {
  surface: "bg-surface",
  raised: "bg-raised",
  accent: "bg-accent",
  accentTint: "bg-accent-tint",
};
const RADIUS = { hero: "rounded-hero p-5", card: "rounded-card p-5", tile: "rounded-tile p-4" };

export default function Card({
  size = "card",
  tone = "surface",
  className = "",
  ...rest
}: CardProps) {
  return (
    <View
      {...rest}
      style={[{ borderCurve: "continuous" }, rest.style]}
      className={`${TONE[tone]} ${RADIUS[size]} ${className}`}
    />
  );
}
