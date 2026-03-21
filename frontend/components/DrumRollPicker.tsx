import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

const ITEM_HEIGHT = 60;

interface DrumRollPickerProps {
  items: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  unit?: string;
}

export function DrumRollPicker({
  items,
  selectedIndex,
  onSelect,
  unit,
}: DrumRollPickerProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      onSelect(Math.max(0, Math.min(index, items.length - 1)));
    },
    [items.length, onSelect]
  );

  const getFontSize = (distance: number) => {
    if (distance === 0) return 44;
    if (distance === 1) return 28;
    if (distance === 2) return 22;
    return 16;
  };

  const getOpacity = (distance: number) => {
    if (distance === 0) return 1;
    if (distance === 1) return 0.6;
    if (distance === 2) return 0.35;
    return 0.18;
  };

  return (
    <View style={styles.container}>
      {/* Purple selection lines */}
      <View style={[styles.line, { top: ITEM_HEIGHT * 3 }]} pointerEvents="none" />
      <View style={[styles.line, { top: ITEM_HEIGHT * 4 }]} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 3 }}
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          const isSelected = distance === 0;
          return (
            <View key={index} style={styles.item}>
              <Text
                style={{
                  fontSize: getFontSize(distance),
                  fontWeight: isSelected ? "bold" : "normal",
                  color: "#fff",
                  opacity: getOpacity(distance),
                }}
              >
                {item}
                {isSelected && unit ? (
                  <Text style={styles.unit}> {unit}</Text>
                ) : null}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 7,
    position: "relative",
    overflow: "hidden",
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  line: {
    position: "absolute",
    left: "20%",
    right: "20%",
    height: 1.5,
    backgroundColor: "#7B5CF0",
    zIndex: 10,
  },
  unit: {
    fontSize: 20,
    fontWeight: "normal",
  },
});
