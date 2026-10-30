import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";

type Props = {
  /** Pages empilées (stack) : couleur de fond de base, sans dégradé ni halo. */
  flat?: boolean;
  /** Halo flou en haut à gauche, réservé au fond commun des onglets. */
  glow?: boolean;
};

export default function ScreenBackground({ flat = false, glow = false }: Props) {
  if (flat) {
    return (
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{ backgroundColor: WorkoutTheme.background }}
      />
    );
  }
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
      {glow ? (
        <LinearGradient
          colors={[
            withAlpha(WorkoutTheme.accent.purpleDark, 0.32),
            withAlpha(WorkoutTheme.accent.purpleDark, 0),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.45 }}
          className="absolute inset-0"
        />
      ) : null}
    </View>
  );
}
