import React, { useEffect, useRef, useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import PressableScale from "./PressableScale";
import Glass from "./Glass";
import { WorkoutTheme } from "@/constants/Colors";

const lastIndex = new Map<string, number>();

type Option<T extends string> = {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "default" | "glass";
  id?: string;
  className?: string;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "default",
  id,
  className = "",
}: Props<T>) {
  const glass = variant === "glass";
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const slot = (width - 8) / options.length;
  const x = useSharedValue(0);

  const placed = useRef(false);
  useEffect(() => {
    if (width <= 0) return;
    if (!placed.current) {
      placed.current = true;
      const from = id ? (lastIndex.get(id) ?? index) : index;
      x.set(from * slot);
    }
    x.set(withTiming(index * slot, { duration: 200, easing: Easing.linear }));
    if (id) lastIndex.set(id, index);
  }, [index, slot, width, id, x]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  const inner = (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      className="flex-1 flex-row p-1"
    >
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 4,
              width: slot,
              borderRadius: 999,
              backgroundColor: WorkoutTheme.accent.purple,
            },
            indicator,
          ]}
        />
      )}
      {options.map((o) => (
        <PressableScale
          key={o.value}
          halo={false}
          onPress={() => {
            if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
            onChange(o.value);
          }}
          accessibilityRole="button"
          accessibilityLabel={o.label}
          accessibilityState={{ selected: o.value === value }}
          className="flex-1 items-center justify-center"
        >
          {o.icon ? (
            <Ionicons
              name={o.icon}
              size={20}
              color={
                o.value === value
                  ? WorkoutTheme.text.primary
                  : WorkoutTheme.text.tertiary
              }
            />
          ) : (
            <Text
              className={`text-sm font-semibold ${o.value === value ? "text-ink" : "text-ink-muted"}`}
            >
              {o.label}
            </Text>
          )}
        </PressableScale>
      ))}
    </View>
  );

  return glass ? (
    <Glass className={`h-12 rounded-full ${className}`}>{inner}</Glass>
  ) : (
    <View className={`h-11 rounded-full bg-raised ${className}`}>{inner}</View>
  );
}
