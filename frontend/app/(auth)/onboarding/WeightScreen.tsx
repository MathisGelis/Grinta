import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const TICK_SPACING = 16;
const MIN_WEIGHT = 30;
const MAX_WEIGHT = 200;
const DEFAULT_WEIGHT = 70;

const weights = Array.from(
  { length: MAX_WEIGHT - MIN_WEIGHT + 1 },
  (_, i) => MIN_WEIGHT + i
);

const getTickHeight = (value: number) => {
  if (value % 10 === 0) return 44;
  if (value % 5 === 0) return 28;
  return 16;
};

export default function WeightScreen() {
  const params = useLocalSearchParams<{ gender: string; age: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / TICK_SPACING);
      const clamped = Math.max(0, Math.min(index, weights.length - 1));
      setWeight(weights[clamped]);
    },
    []
  );

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/HeightScreen",
      params: { gender: params.gender, age: params.age, weight: String(weight) },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What&apos;s your weight?</Text>
      <Text style={styles.subtitle}>You can always change this later</Text>

      <View style={styles.valueContainer}>
        <Text style={styles.value}>{weight}</Text>
        <Text style={styles.unit}>kg</Text>
      </View>

      {/* Ruler */}
      <View style={styles.rulerWrapper}>
        {/* Fixed center indicator */}
        <View style={styles.indicator} pointerEvents="none" />

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_SPACING}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={{
            paddingHorizontal: width / 2 - TICK_SPACING / 2,
            alignItems: "flex-end",
            height: 64,
          }}
          contentOffset={{ x: (DEFAULT_WEIGHT - MIN_WEIGHT) * TICK_SPACING, y: 0 }}
        >
          {weights.map((w) => {
            const dist = Math.abs(w - weight);
            const tickH = getTickHeight(w);
            const color =
              dist === 0
                ? "#A56BFF"
                : dist <= 5
                ? "#7B5CF0"
                : dist <= 12
                ? "#555"
                : "#333";
            return (
              <View
                key={w}
                style={[
                  styles.tick,
                  {
                    height: tickH,
                    backgroundColor: color,
                    marginHorizontal: TICK_SPACING / 2 - 1,
                  },
                ]}
              />
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.nav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>Next  ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    marginBottom: 48,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 32,
  },
  value: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 80,
  },
  unit: {
    fontSize: 24,
    color: "#888",
    marginBottom: 12,
    marginLeft: 8,
  },
  rulerWrapper: {
    height: 64,
    justifyContent: "center",
    position: "relative",
  },
  indicator: {
    position: "absolute",
    left: width / 2 - 1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#A56BFF",
    zIndex: 10,
  },
  tick: {
    width: 2,
    borderRadius: 1,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 48,
    paddingTop: 48,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    color: "#fff",
    fontSize: 20,
  },
  nextBtn: {
    backgroundColor: "#7B5CF0",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 40,
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
