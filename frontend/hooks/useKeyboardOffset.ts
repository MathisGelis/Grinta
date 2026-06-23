import { useEffect, useRef } from "react";
import { Keyboard, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useKeyboardOffset(navbarHeight = 60) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + navbarHeight;
  const keyboardY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      Animated.spring(keyboardY, {
        toValue: -(e.endCoordinates.height - bottomOffset),
        useNativeDriver: true,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      Animated.spring(keyboardY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [bottomOffset, keyboardY]);

  return { keyboardY, bottomOffset };
}