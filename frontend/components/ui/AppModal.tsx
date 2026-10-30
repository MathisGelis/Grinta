import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const DRAG_ZONE_HEIGHT = 28;
const ENTER_MS = 260;
const EXIT_MS = 200;

type Props = {
  isVisible: boolean;
  onBackdropPress?: () => void;
  onSwipeComplete?: () => void;
  swipeDirection?: "down";
  animationIn?: "slideInUp" | "fadeIn";
  style?: ViewStyle;
  children: React.ReactNode;
};

export default function AppModal({
  isVisible,
  onBackdropPress,
  onSwipeComplete,
  swipeDirection,
  animationIn = "slideInUp",
  style,
  children,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const slides = animationIn === "slideInUp";
  const swipeable = swipeDirection === "down" && !!onSwipeComplete;

  const [mounted, setMounted] = useState(isVisible);
  const backdrop = useSharedValue(0);
  const enter = useSharedValue(slides ? 1 : 0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setMounted(true);
      drag.set(0);
      enter.set(slides ? 1 : 0);
      backdrop.set(withTiming(1, { duration: ENTER_MS }));
      enter.set(
        slides
          ? withTiming(0, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) })
          : 0,
      );
      return;
    }

    backdrop.set(withTiming(0, { duration: EXIT_MS }));
    if (slides) {
      enter.set(withTiming(1, { duration: EXIT_MS, easing: Easing.in(Easing.cubic) }));
    }
    const timeout = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timeout);
  }, [isVisible, slides, backdrop, enter, drag]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(swipeable)
    .activeOffsetY(10)
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      drag.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 800) {
        onSwipeComplete?.();
      } else {
        drag.set(withSpring(0));
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: slides ? 1 : backdrop.get(),
    transform: [{ translateY: enter.get() * windowHeight + drag.get() }],
  }));

  const content = (
    <View style={{ flex: 1 }}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: WorkoutTheme.overlay.dim },
          backdropStyle,
        ]}
      />
      <Pressable style={StyleSheet.absoluteFill} onPress={onBackdropPress} />
      <View style={[{ flex: 1 }, style]} pointerEvents="box-none">
        <Animated.View style={sheetStyle}>
          {children}
          {swipeable ? (
            <GestureDetector gesture={pan}>
              <View
                collapsable={false}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: DRAG_ZONE_HEIGHT,
                }}
              />
            </GestureDetector>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBackdropPress}
    >
      {swipeable ? (
        <GestureHandlerRootView style={{ flex: 1 }}>{content}</GestureHandlerRootView>
      ) : (
        content
      )}
    </Modal>
  );
}
