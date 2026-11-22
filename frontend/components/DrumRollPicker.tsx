import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { WorkoutTheme } from "@/constants/Colors";

const ITEM_HEIGHT = 60;
const BASE_FONT = 44;

interface DrumRollPickerProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  unit?: string;
  /** Taille du texte sélectionné (44 par défaut) ; réduire pour les libellés longs. */
  fontSize?: number;
  /** Hauteur d'une ligne (60 par défaut). */
  itemHeight?: number;
  /** Nombre de lignes visibles, impair (7 par défaut). */
  rows?: number;
}

function Item({
  label,
  unit,
  index,
  scrollY,
  fontSize,
  itemHeight,
}: {
  itemHeight: number;
  label: string | number;
  unit?: string;
  fontSize: number;
  index: number;
  scrollY: SharedValue<number>;
}) {
  // La mise en avant dépend de la position exacte : elle suit le doigt, sans passer par React.
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.get() / itemHeight - index);
    return {
      opacity: interpolate(distance, [0, 1, 2, 3], [1, 0.6, 0.35, 0.18], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(distance, [0, 1, 2, 3], [1, 0.64, 0.5, 0.36], Extrapolation.CLAMP) },
      ],
    } as ViewStyle;
  });
  const unitStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(scrollY.get() / itemHeight - index), [0, 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.item, { height: itemHeight }]}>
      <Animated.View style={[styles.row, style]}>
        <Animated.Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{ fontSize, fontWeight: "bold", color: WorkoutTheme.text.primary, flexShrink: 1 }}
        >
          {label}
        </Animated.Text>
        {unit ? (
          <Animated.Text
            style={[{ fontSize: 20, marginLeft: 6, color: WorkoutTheme.text.primary }, unitStyle]}
          >
            {unit}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

export function DrumRollPicker({
  items,
  selectedIndex,
  onSelect,
  unit,
  fontSize = BASE_FONT,
  itemHeight = ITEM_HEIGHT,
  rows = 7,
}: DrumRollPickerProps) {
  const mid = Math.floor(rows / 2);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(selectedIndex * itemHeight);
  const live = useRef(selectedIndex);
  const max = items.length - 1;

  const handleScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const commit = useCallback(
    (index: number) => {
      if (index === live.current) return;
      live.current = index;
      Haptics.selectionAsync();
      onSelect(index);
    },
    [onSelect],
  );

  // Choix suivi en direct pendant le défilement, avec un léger retour haptique à chaque cran.
  useAnimatedReaction(
    () => Math.max(0, Math.min(Math.round(scrollY.get() / itemHeight), max)),
    (index, previous) => {
      if (previous !== null && index !== previous) runOnJS(commit)(index);
    },
  );

  // Position initiale, puis repositionnement si la valeur est changée de l'extérieur.
  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: live.current * itemHeight, animated: false });
    }, 50);
    return () => clearTimeout(timeout);
  }, [itemHeight]);

  useEffect(() => {
    if (selectedIndex === live.current) return;
    live.current = selectedIndex;
    scrollRef.current?.scrollTo({ y: selectedIndex * itemHeight, animated: false });
  }, [selectedIndex, itemHeight]);

  return (
    <View style={[styles.container, { height: itemHeight * rows }]}>
      <View
        className="absolute left-[20%] right-[20%] h-[1.5px] bg-accent z-[10]"
        style={{ top: itemHeight * mid }}
        pointerEvents="none"
      />
      <View
        className="absolute left-[20%] right-[20%] h-[1.5px] bg-accent z-[10]"
        style={{ top: itemHeight * (mid + 1) }}
        pointerEvents="none"
      />

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: itemHeight * mid }}
      >
        {items.map((item, index) => (
          <Item key={index} itemHeight={itemHeight} label={item} unit={unit} fontSize={fontSize} index={index} scrollY={scrollY} />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  item: {
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    maxWidth: "100%",
  },
});
