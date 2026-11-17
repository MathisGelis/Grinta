import React, { useEffect } from "react";
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Briques de base des squelettes de chargement : un bloc qui pulse doucement.
 * `tone` = couleur du bloc : "raised" sur une carte (bg-surface), "surface" directement sur le fond.
 */
type Tone = "surface" | "raised";

type BlockProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  tone?: Tone;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

const TONE_CLASS: Record<Tone, string> = { surface: "bg-surface", raised: "bg-raised" };

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  tone = "raised",
  className = "",
  style,
}: BlockProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity, reduced]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`${TONE_CLASS[tone]} ${className}`}
      style={[{ width, height, borderRadius: radius, borderCurve: "continuous" }, animated, style]}
    />
  );
}

export function SkeletonCircle({ size = 40, ...rest }: Omit<BlockProps, "width" | "height" | "radius"> & { size?: number }) {
  return <Skeleton {...rest} width={size} height={size} radius={size / 2} />;
}

/** Lignes de texte : la dernière est plus courte. */
export function SkeletonText({
  lines = 2,
  lineHeight = 12,
  gap = 8,
  tone = "raised",
  lastWidth = "60%",
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  tone?: Tone;
  lastWidth?: DimensionValue;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          tone={tone}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastWidth : "100%"}
        />
      ))}
    </View>
  );
}

/** Répète un squelette `count` fois, avec l'espacement donné. */
export function SkeletonList({
  count = 4,
  gap = 12,
  children,
}: {
  count?: number;
  gap?: number;
  children: React.ReactNode | ((index: number) => React.ReactNode);
}) {
  return (
    <View style={{ gap }} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <React.Fragment key={i}>
          {typeof children === "function" ? children(i) : children}
        </React.Fragment>
      ))}
    </View>
  );
}
