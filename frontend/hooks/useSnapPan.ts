import { useCallback, useEffect, useRef } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDecay,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type Options = {
  axis: "x" | "y";
  /** Distance entre deux crans, en px. */
  itemSize: number;
  count: number;
  /** Index du cran choisi (contrôlé). */
  index: number;
  onIndexChange: (index: number) => void;
};

/**
 * Défilement à crans piloté par un geste de glissement sur un seul axe (pas de ScrollView):
 * la position ne peut varier que le long de cet axe, avec inertie puis calage sur le cran le plus proche.
 */
export function useSnapPan({ axis, itemSize, count, index, onIndexChange }: Options) {
  const maxPos = (count - 1) * itemSize;
  const pos = useSharedValue(index * itemSize);
  const start = useSharedValue(0);
  const live = useRef(index);

  const commit = useCallback(
    (next: number) => {
      if (next === live.current) return;
      live.current = next;
      Haptics.selectionAsync();
      onIndexChange(next);
    },
    [onIndexChange],
  );

  useAnimatedReaction(
    () => Math.max(0, Math.min(Math.round(pos.get() / itemSize), count - 1)),
    (next, previous) => {
      if (previous !== null && next !== previous) runOnJS(commit)(next);
    },
  );

  // Valeur changée de l'extérieur: on recale (sans effet si elle vient du geste).
  useEffect(() => {
    if (index === live.current) return;
    live.current = index;
    cancelAnimation(pos);
    pos.set(withTiming(index * itemSize, { duration: 200 }));
  }, [index, itemSize, pos]);

  const horizontal = axis === "x";
  const gesture = Gesture.Pan()
    .activeOffsetX(horizontal ? [-4, 4] : [-10000, 10000])
    .activeOffsetY(horizontal ? [-10000, 10000] : [-4, 4])
    .failOffsetY(horizontal ? [-40, 40] : [-10000, 10000])
    .failOffsetX(horizontal ? [-10000, 10000] : [-40, 40])
    .onBegin(() => {
      cancelAnimation(pos);
      start.set(pos.get());
    })
    .onUpdate((e) => {
      const delta = horizontal ? e.translationX : e.translationY;
      pos.set(Math.max(0, Math.min(start.get() - delta, maxPos)));
    })
    .onEnd((e) => {
      const velocity = -(horizontal ? e.velocityX : e.velocityY);
      pos.set(
        withDecay({ velocity, clamp: [0, maxPos], deceleration: 0.995 }, (finished) => {
          if (finished) {
            pos.set(withTiming(Math.round(pos.get() / itemSize) * itemSize, { duration: 120 }));
          }
        }),
      );
    })
    .onFinalize((_e, success) => {
      // Appui sans glissement: on cale quand même sur le cran le plus proche.
      if (!success) {
        pos.set(withTiming(Math.round(pos.get() / itemSize) * itemSize, { duration: 120 }));
      }
    });

  return { pos, gesture };
}
