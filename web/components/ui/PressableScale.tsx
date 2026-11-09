import React from "react";
import { Pressable, StyleSheet, type PressableProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";

const NAMED_RADIUS: Record<string, number> = {
  full: 999, hero: 32, card: 28, tile: 22, "3xl": 24, "2xl": 16, xl: 12,
  lg: 8, md: 6, sm: 2, none: 0,
};

function radiusOf(className: string | undefined, style: unknown): number | null {
  const flat = StyleSheet.flatten(style as never) as { borderRadius?: number } | undefined;
  if (typeof flat?.borderRadius === "number") return flat.borderRadius;
  const m = className?.match(/(?:^|\s)rounded(?:-(full|hero|card|tile|3xl|2xl|xl|lg|md|sm|none)|-\[(\d+)px\])?(?=\s|$)/);
  if (!m) return null;
  if (m[2]) return Number(m[2]);
  return NAMED_RADIUS[m[1] ?? ""] ?? 4;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  className?: string;
  haptic?: boolean;
  halo?: "circle" | "fill" | false;
  haloSize?: number;
};

export default function PressableScale({
  haptic = false,
  halo,
  haloSize = 36,
  className,
  children,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const haloStyle = useAnimatedStyle(() => ({ opacity: pressed.get() }));
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const radius =
    halo === false
      ? null
      : halo === "circle"
        ? haloSize / 2
        : (radiusOf(className, style) ?? (halo === "fill" ? 999 : null));

  return (
    <AnimatedPressable
      {...rest}
      className={className}
      onPressIn={(e) => {
        scale.set(withSpring(0.97, { damping: 18, stiffness: 400 }));
        if (haptic && process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        if (radius !== null) {
          pressed.set(
            withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }),
          );
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, { damping: 18, stiffness: 400 }));
        if (radius !== null) {
          pressed.set(
            withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) }),
          );
        }
        onPressOut?.(e);
      }}
      style={[animated, style as object]}
    >
      {children as React.ReactNode}
      {radius !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              backgroundColor: withAlpha(WorkoutTheme.text.primary, 0.12),
              borderRadius: radius,
              ...(halo === "circle"
                ? { width: haloSize, height: haloSize }
                : { top: 0, bottom: 0, left: 0, right: 0 }),
            },
            haloStyle,
          ]}
        />
      ) : null}
    </AnimatedPressable>
  );
}
