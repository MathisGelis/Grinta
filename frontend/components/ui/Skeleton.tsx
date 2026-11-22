import React, { useEffect, useState } from "react";
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Briques de base des squelettes de chargement : un bloc avec un reflet qui le traverse (shimmer).
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
const SHEEN = ["rgba(255,255,255,0)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0)"] as const;

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  tone = "raised",
  className = "",
  style,
}: BlockProps) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
  }, [progress, reduced]);

  const sheen = useAnimatedStyle(() => ({
    transform: [{ translateX: -w + progress.value * w * 2 }],
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      className={`overflow-hidden ${TONE_CLASS[tone]} ${className}`}
      style={[{ width, height, borderRadius: radius, borderCurve: "continuous" }, style]}
    >
      {reduced || w === 0 ? null : (
        <Animated.View style={[{ ...StyleSheetFill, width: w }, sheen]}>
          <LinearGradient
            colors={SHEEN}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const StyleSheetFill = { position: "absolute", top: 0, bottom: 0, left: 0 } as const;

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
