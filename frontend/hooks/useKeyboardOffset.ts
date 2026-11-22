import { useAnimatedStyle } from "react-native-reanimated";
import { useKeyboardState, useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useKeyboardOffset(navbarHeight = 76) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + navbarHeight;
  const { height } = useReanimatedKeyboardAnimation();
  // Remonte la barre pile au-dessus du clavier, en suivant son animation native.
  const keyboardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(0, height.value + bottomOffset) }],
  }));

  return { keyboardStyle, bottomOffset };
}

export function useBottomOffset(navbarHeight = 76) {
  const insets = useSafeAreaInsets();
  return insets.bottom + navbarHeight;
}

/** Hauteur animée du clavier (keyboard-controller), calée image par image sur son animation native. */
export function useKeyboardSheet() {
  const { height } = useReanimatedKeyboardAnimation();
  const keyboard = useKeyboardState((s) => s.isVisible);
  const sheetStyle = useAnimatedStyle(() => ({ marginBottom: -height.value }));
  return { keyboard, sheetStyle };
}
