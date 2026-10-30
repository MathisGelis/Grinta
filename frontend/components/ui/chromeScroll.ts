import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Easing, makeMutable, withTiming } from "react-native-reanimated";

export const chromeY = makeMutable(0);
export const chromeCompact = makeMutable(0);

const THRESHOLD = 4;
let lastY = 0;
let target = 0;
let armed = false;

function setCompact(next: 0 | 1) {
  if (next === target) return;
  target = next;
  chromeCompact.set(withTiming(next, { duration: 480, easing: Easing.inOut(Easing.quad) }));
}

export function onChromeScroll(y: number) {
  if (!armed) return;
  const offset = Math.max(0, y);
  const delta = offset - lastY;
  chromeY.set(offset);
  if (offset <= 8) setCompact(0);
  else if (delta > THRESHOLD) setCompact(1);
  else if (delta < -THRESHOLD) setCompact(0);
  lastY = offset;
}

export function armChrome() {
  armed = true;
}

export function resetChrome() {
  armed = false;
  lastY = 0;
  chromeY.set(0);
  setCompact(0);
}

export function expandChrome() {
  setCompact(0);
}

export const chromeScrollProps = {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    onChromeScroll(e.nativeEvent.contentOffset.y),
  onScrollBeginDrag: armChrome,
  scrollEventThrottle: 16,
};
