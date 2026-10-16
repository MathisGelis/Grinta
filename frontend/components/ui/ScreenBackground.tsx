import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutTheme } from "@/constants/Colors";

export default function ScreenBackground() {
  return (
    <View pointerEvents="none" className="absolute inset-0">
      <LinearGradient
        colors={[
          WorkoutTheme.background,
          WorkoutTheme.backgroundSecondary,
          WorkoutTheme.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
    </View>
  );
}
