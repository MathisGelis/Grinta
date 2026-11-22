import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

const DURATION_MS = 2800;
const ICON: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

let nextId = 1;
let listener: ((item: ToastItem) => void) | null = null;

function emit(kind: ToastKind, message: string) {
  listener?.({ id: nextId++, kind, message });
}

/** Confirmations légères, utilisables depuis n'importe quel écran ou callback. */
export const toast = {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
  info: (message: string) => emit("info", message),
};

/** À monter une seule fois, à la racine de l'app. Un toast à la fois : le dernier remplace le précédent. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = (next) => {
      if (timer.current) clearTimeout(timer.current);
      setItem(next);
      timer.current = setTimeout(() => setItem(null), DURATION_MS);
    };
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const color =
    item?.kind === "error"
      ? WorkoutTheme.status.danger
      : item?.kind === "success"
        ? WorkoutTheme.status.success
        : WorkoutTheme.accent.purple;

  return (
    <View
      pointerEvents="none"
      className="absolute inset-x-0 top-0 items-center px-5"
      style={{ paddingTop: insets.top + 8 }}
    >
      {item ? (
        <Animated.View
          key={item.id}
          entering={FadeInUp.duration(180)}
          exiting={FadeOutUp.duration(160)}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="max-w-full flex-row items-center gap-3 rounded-full bg-raised px-5 py-3"
          style={{
            borderCurve: "continuous",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Ionicons name={ICON[item.kind]} size={22} color={color} />
          <Text className="shrink text-sm font-medium text-ink" numberOfLines={2}>
            {item.message}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
