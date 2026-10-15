import React from "react";
import { Platform, View, type ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";

type GlassProps = ViewProps & {
  intensity?: number;
  className?: string;
};

export default function Glass({
  intensity = 40,
  className = "",
  children,
  ...rest
}: GlassProps) {
  const ios = Platform.OS === "ios";
  return (
    <View
      {...rest}
      className={`overflow-hidden border ${className}`}
      style={[{ borderColor: WorkoutTheme.overlay.glassBorder }, rest.style]}
    >
      {ios ? (
        <BlurView
          intensity={intensity}
          tint="dark"
          className="absolute inset-0"
        />
      ) : null}
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{
          backgroundColor: ios
            ? WorkoutTheme.overlay.glassFill
            : withAlpha(WorkoutTheme.backgroundSecondary, 0.92),
        }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[WorkoutTheme.overlay.glassFill, "transparent"]}
        className="absolute inset-x-0 top-0 h-[45%]"
      />
      {children}
    </View>
  );
}
