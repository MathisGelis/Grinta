import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import type { BottomTabBarProps } from "expo-router/build/layouts/Tabs";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Glass from "./Glass";
import PressableScale from "./PressableScale";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { usePathname } from "expo-router";
import { chromeCompact, expandChrome, resetChrome } from "./chromeScroll";

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, [IconName, IconName]> = {
  explore: ["home-outline", "home"],
  workouts: ["barbell-outline", "barbell"],
  "workout-trigger": ["add", "add"],
  stats: ["bar-chart-outline", "bar-chart"],
  profile: ["person-outline", "person"],
};

const BAR_HEIGHT = 68;
const INDICATOR_INSET = 2;
const INDICATOR_H = BAR_HEIGHT - 2 - INDICATOR_INSET * 2;

function TabIcon({
  name,
  label,
  focused,
}: {
  name: IconName;
  label: string;
  focused: boolean;
}) {
  const progress = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 200,
      easing: Easing.linear,
    });
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -7 * progress.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 13 + 4 * (1 - progress.value) }],
  }));

  return (
    <View className="h-full w-full items-center justify-center">
      <Animated.View style={iconStyle}>
        <Ionicons
          name={name}
          size={24}
          color={focused ? WorkoutTheme.text.primary : WorkoutTheme.text.tertiary}
        />
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[
          {
            position: "absolute",
            top: "50%",
            marginTop: -6,
            lineHeight: 12,
            fontSize: 10,
            fontWeight: "600",
            color: WorkoutTheme.text.primary,
          },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </View>
  );
}

type Props = BottomTabBarProps & {
  sessionActive?: boolean;
};

export default function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  sessionActive = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    explore: t.tabExplore,
    workouts: t.sessions,
    stats: t.tabStats,
    profile: t.profile,
  };
  const [width, setWidth] = useState(0);
  const pathname = usePathname();

  // Nouvelle page : la barre repart à sa taille normale.
  useEffect(() => {
    resetChrome();
  }, [pathname]);

  const routes = state.routes.filter(
    (r) =>
      (StyleSheet.flatten(descriptors[r.key].options.tabBarItemStyle) as
        | ViewStyle
        | undefined)?.display !== "none",
  );
  const activeKey = state.routes[state.index].key;
  const activeIndex = Math.max(
    0,
    routes.findIndex((r) => r.key === activeKey),
  );
  const slot = width / Math.max(routes.length, 1);

  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(activeIndex * slot + INDICATOR_INSET, {
      duration: 200,
      easing: Easing.linear,
    });
  }, [activeIndex, slot, x]);
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = sessionActive
      ? withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1)
      : 0;
  }, [sessionActive, pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + 0.6 * pulse.value }],
  }));

  // Réduite en descendant l'accueil, rétablie en remontant (ancrée en bas).
  const shrinkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.2 * chromeCompact.get() }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <Animated.View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 px-5"
      style={[{ paddingBottom: insets.bottom + 8, transformOrigin: "50% 100%" }, shrinkStyle]}
      onTouchStart={expandChrome}
    >
      <Glass
        intensity={50}
        className="rounded-full"
        style={{ height: BAR_HEIGHT, borderCurve: "continuous" }}
      >
        <View
          onLayout={onLayout}
          className="flex-1 flex-row items-center"
        >
          {width > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  left: 0,
                  width: slot - INDICATOR_INSET * 2,
                  height: INDICATOR_H,
                  top: INDICATOR_INSET,
                  borderRadius: 999,
                  backgroundColor: WorkoutTheme.overlay.glassBorder,
                },
                circleStyle,
              ]}
            />
          )}
          {routes.map((route, i) => {
            const focused = i === activeIndex;
            const isCenter = route.name === "workout-trigger";
            const [outline, filled] = ICONS[route.name] ?? ["ellipse-outline", "ellipse"];
            const icon: IconName =
              isCenter && sessionActive ? "pulse" : focused ? filled : outline;

            const onPress = () => {
              const event = emitter.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              resetChrome();
              if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
              if (!focused && !event.defaultPrevented) {
                navigateToTab(route.key);
              }
            };

            return (
              <PressableScale
                key={route.key}
                onPress={onPress}
                halo={false}
                accessibilityRole="button"
                accessibilityLabel={labels[route.name] ?? route.name}
                accessibilityState={{ selected: focused }}
                className="h-full flex-1 items-center justify-center"
              >
                {isCenter ? (
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-accent">
                    {sessionActive && (
                      <Animated.View
                        pointerEvents="none"
                        className="absolute h-14 w-14 rounded-full bg-accent"
                        style={haloStyle}
                      />
                    )}
                    <Ionicons
                      name={icon}
                      size={sessionActive ? 26 : 32}
                      color={WorkoutTheme.text.primary}
                    />
                  </View>
                ) : (
                  <TabIcon
                    name={icon}
                    label={labels[route.name] ?? route.name}
                    focused={focused}
                  />
                )}
              </PressableScale>
            );
          })}
        </View>
      </Glass>
    </Animated.View>
  );
}
