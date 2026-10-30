import React from "react";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { chromeY } from "./chromeScroll";

// Flou progressif : 16 couches très légères, de plus en plus courtes. Le flou cumulé décroît
// linéairement du haut vers le bas, sans palier visible à la fin.
// Voile de la couleur du fond, très progressif : sans flou natif (Android) il sépare le titre du
// contenu ; il reste discret pour ne jamais former une bande visible autour de la barre.
const VEIL_STOPS = [1, 0.75, 0.45, 0.2, 0.06, 0];
const VEIL_ALPHA = Platform.OS === "ios" ? 0.3 : 0.55;
const BLUR_LAYER_COUNT = 16;
const BLUR_LAYERS = Array.from({ length: BLUR_LAYER_COUNT }, (_, i) => 1 - i / BLUR_LAYER_COUNT);

/**
 * Fond d'une barre du haut flottante : un flou doux qui s'estompe vers le bas et apparaît
 * à mesure que la page défile. `height` : jusqu'où le flou descend (bas de la barre).
 */
export default function TopBlur({ height }: { height: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, chromeY.get() / 48),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute inset-x-0 top-0"
      style={[{ height }, style]}
    >
      {Platform.OS === "ios"
        ? BLUR_LAYERS.map((share) => (
            <BlurView
              key={share}
              intensity={3.5}
              tint="dark"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: height * share,
              }}
            />
          ))
        : null}
      <LinearGradient
        colors={VEIL_STOPS.map((stop) => withAlpha(WorkoutTheme.background, VEIL_ALPHA * stop)) as [string, string, ...string[]]}
        locations={[0, 0.2, 0.45, 0.7, 0.9, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
