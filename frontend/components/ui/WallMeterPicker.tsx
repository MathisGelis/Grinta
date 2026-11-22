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

type WallMeterPickerProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  tickHeight?: number;
  width?: number;
};

type TickProps = {
  index: number;
  v: number;
  tickHeight: number;
  halfHeight: SharedValue<number>;
  pos: SharedValue<number>;
  major: boolean;
  medium: boolean;
};

const Tick = React.memo(function Tick({ index, v, tickHeight, halfHeight, pos, major, medium }: TickProps) {
  const style = useAnimatedStyle(() => {
    const offset = index * tickHeight - pos.get();
    const half = halfHeight.get();
    return {
      // Fondu en haut et en bas du mètre.
      opacity: interpolate(Math.abs(offset), [half * 0.45, half], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: offset }],
    };
  });

  return (
    <Animated.View
      style={[
        { position: "absolute", right: 0, top: "50%", marginTop: -tickHeight / 2, height: tickHeight, justifyContent: "center", alignItems: "flex-end" },
        style,
      ]}
    >
      <View
        style={{
          height: 3,
          width: major ? 64 : medium ? 44 : 26,
          borderRadius: 1,
          backgroundColor: major ? WorkoutTheme.text.secondary : WorkoutTheme.text.disabled,
        }}
      />
      {major ? (
        <Text
          numberOfLines={1}
          style={{
            position: "absolute",
            right: 72,
            width: 50,
            textAlign: "right",
            fontSize: 16,
            fontWeight: "600",
            color: WorkoutTheme.text.secondary,
          }}
        >
          {v}
        </Text>
      ) : null}
    </Animated.View>
  );
});

/**
 * Mètre mural vertical, sans cadre: il prend toute la hauteur disponible, les valeurs croissent
 * vers le haut, le repère central indique la valeur et le haut/bas s'estompent.
 */
export default function WallMeterPicker({
  value,
  onChange,
  min,
  max,
  tickHeight = 10,
  width = 180,
}: WallMeterPickerProps) {
  // Estimation immédiate de la hauteur, affinée dès que la vraie hauteur est mesurée:
  // les graduations s'affichent donc dès le premier rendu.
  const windowHeight = useWindowDimensions().height;
  const halfHeight = useSharedValue(windowHeight * 0.3);
  const count = max - min + 1;
  // Index 0 en haut = valeur max.
  const index = Math.max(0, Math.min(count - 1, max - Math.round(value)));

  const { pos, gesture } = useSnapPan({
    axis: "y",
    itemSize: tickHeight,
    count,
    index,
    onIndexChange: (i) => onChange(max - i),
  });

  // Seules les graduations proches de la valeur sont montées (le reste est hors champ).
  const windowSize = Math.ceil((windowHeight * 0.35) / tickHeight) + 6;
  const first = Math.max(0, index - windowSize);
  const last = Math.min(count - 1, index + windowSize);

  const ticks = useMemo(
    () =>
      Array.from({ length: last - first + 1 }, (_, n) => {
        const i = first + n;
        const v = max - i;
        const major = v % 10 === 0;
        return (
          <Tick
            key={i}
            index={i}
            v={v}
            tickHeight={tickHeight}
            halfHeight={halfHeight}
            pos={pos}
            major={major}
            medium={!major && v % 5 === 0}
          />
        );
      }),
    [first, last, max, tickHeight, halfHeight, pos],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ width, alignSelf: "stretch", overflow: "hidden" }}
        onLayout={(e) => halfHeight.set(e.nativeEvent.layout.height / 2)}
      >
        {ticks}

        {/* Repère central fixe, comme un trait de crayon sur le mur */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            marginTop: -1.5,
            height: 3,
            borderRadius: 2,
            backgroundColor: WorkoutTheme.accent.purple,
          }}
        />
      </View>
    </GestureDetector>
  );
}
