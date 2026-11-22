import React, { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import { WorkoutTheme } from "@/constants/Colors";
import { useSnapPan } from "@/hooks/useSnapPan";

type RulerPickerProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Une graduation haute (et chiffrée) tous les `majorEvery` (en unités de valeur). */
  majorEvery?: number;
  /** Une graduation moyenne tous les `mediumEvery` (en unités de valeur). */
  mediumEvery?: number;
  tickWidth?: number;
  /** Rayon du cadran en px: plus il est petit, plus la règle est arrondie. */
  radius?: number;
};

const NEEDLE = 18;
const MAJOR = 50;
const LABEL = 28;

type TickProps = {
  index: number;
  v: number;
  tickWidth: number;
  radius: number;
  halfWidth: SharedValue<number>;
  pos: SharedValue<number>;
  major: boolean;
  medium: boolean;
};

// Chaque graduation est posée sur l'arc d'un cadran et orientée vers son centre: le cadran tourne sur lui-même.
const Tick = React.memo(function Tick({
  index,
  v,
  tickWidth,
  radius,
  halfWidth,
  pos,
  major,
  medium,
}: TickProps) {
  const style = useAnimatedStyle(() => {
    const offset = index * tickWidth - pos.get();
    const angle = offset / radius;
    const maxAngle = Math.min(1.25, halfWidth.get() / radius);
    return {
      opacity: interpolate(
        Math.abs(angle),
        [maxAngle * 0.7, maxAngle * 1.05],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        { translateX: radius * Math.sin(angle) },
        { translateY: radius * (1 - Math.cos(angle)) },
        { rotate: `${angle}rad` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: "50%", marginLeft: -tickWidth / 2, width: tickWidth, alignItems: "center", paddingTop: NEEDLE },
        style,
      ]}
    >
      <View
        style={{
          width: 3,
          height: major ? MAJOR : medium ? 36 : 24,
          borderRadius: 1,
          backgroundColor: major ? WorkoutTheme.text.secondary : WorkoutTheme.text.disabled,
        }}
      />
      {major ? (
        <Text
          numberOfLines={1}
          style={{
            position: "absolute",
            top: NEEDLE + MAJOR + 4,
            width: tickWidth * 4,
            textAlign: "center",
            fontSize: 15,
            color: WorkoutTheme.text.tertiary,
          }}
        >
          {v}
        </Text>
      ) : null}
    </Animated.View>
  );
});

/** Cadran arrondi façon vieille balance: l'aiguille du haut pointe la valeur choisie. */
export default function RulerPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  majorEvery = 10,
  mediumEvery = 5,
  tickWidth = 16,
  radius = 280,
}: RulerPickerProps) {
  const windowWidth = useWindowDimensions().width;
  // Estimation immédiate (marges de l'écran déduites), affinée dès que la vraie largeur est mesurée:
  // les graduations s'affichent donc dès le premier rendu.
  const halfWidth = useSharedValue((windowWidth - 64) / 2);
  const count = Math.floor((max - min) / step) + 1;
  const index = Math.max(0, Math.min(count - 1, Math.round((value - min) / step)));

  const { pos, gesture } = useSnapPan({
    axis: "x",
    itemSize: tickWidth,
    count,
    index,
    onIndexChange: (i) => onChange(min + i * step),
  });

  const maxAngle = Math.min(1.25, (windowWidth - 64) / 2 / radius);
  const height = NEEDLE + MAJOR + LABEL + Math.ceil(radius * (1 - Math.cos(maxAngle)));

  // Seules les graduations proches de la valeur sont montées (le reste est hors champ):
  // l'écran s'ouvre vite, sans monter des centaines de vues animées.
  const windowSize = Math.ceil((maxAngle * radius) / tickWidth) + 8;
  const first = Math.max(0, index - windowSize);
  const last = Math.min(count - 1, index + windowSize);

  const ticks = useMemo(
    () =>
      Array.from({ length: last - first + 1 }, (_, n) => {
        const i = first + n;
        const v = min + i * step;
        const major = v % majorEvery === 0;
        return (
          <Tick
            key={i}
            index={i}
            v={v}
            tickWidth={tickWidth}
            radius={radius}
            halfWidth={halfWidth}
            pos={pos}
            major={major}
            medium={!major && v % mediumEvery === 0}
          />
        );
      }),
    [first, last, min, step, majorEvery, mediumEvery, tickWidth, radius, halfWidth, pos],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ height, overflow: "hidden" }}
        onLayout={(e) => halfWidth.set(e.nativeEvent.layout.width / 2)}
      >
        {ticks}

        {/* Aiguille fixe en haut du cadran */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            marginLeft: -10,
            width: 0,
            height: 0,
            borderLeftWidth: 10,
            borderRightWidth: 10,
            borderTopWidth: 16,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: WorkoutTheme.accent.purple,
          }}
        />
      </View>
    </GestureDetector>
  );
}
