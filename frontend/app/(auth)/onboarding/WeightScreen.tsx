import React, { useRef, useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
const { width } = Dimensions.get("window");
const TICK_SPACING = 16;
const MIN_WEIGHT = 30;
const MAX_WEIGHT = 200;
const DEFAULT_WEIGHT = 70;

const weights = Array.from(
  { length: MAX_WEIGHT - MIN_WEIGHT + 1 },
  (_, i) => MIN_WEIGHT + i,
);

const getTickHeight = (value: number) => {
  if (value % 10 === 0) return 44;
  if (value % 5 === 0) return 28;
  return 16;
};

export default function WeightScreen() {
  const { t } = useTranslation();
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
    [],
  );

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/HeightScreen",
      params: {
        gender: params.gender,
        age: params.age,
        weight: String(weight),
      },
    });
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink mb-3">{t.whatsYourWeight}</Text>
      <Text className="text-[15px] text-ink-muted mb-12">{t.changeLaterHint}</Text>

      <View className="flex-row items-end justify-center mb-8">
        <Text className="text-[72px] font-bold text-ink leading-[80px]">{weight}</Text>
        <Text className="text-2xl text-ink-muted mb-3 ml-2">kg</Text>
      </View>

      <View className="h-16 justify-center relative">
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
          contentOffset={{
            x: (DEFAULT_WEIGHT - MIN_WEIGHT) * TICK_SPACING,
            y: 0,
          }}
        >
          {weights.map((w) => {
            const dist = Math.abs(w - weight);
            const tickH = getTickHeight(w);
            const color =
              dist === 0
                ? WorkoutTheme.accent.purple
                : dist <= 5
                  ? WorkoutTheme.accent.purple
                  : dist <= 12
                    ? WorkoutTheme.text.disabled
                    : WorkoutTheme.border;
            return (
              <View
                key={w}
                className="w-0.5 rounded-[1px]" style={{
                    height: tickH,
                    backgroundColor: color,
                    marginHorizontal: TICK_SPACING / 2 - 1,
                  }}
              />
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-row items-center justify-between pb-12 pt-12">
        <PressableScale className="w-[52px] h-[52px] rounded-[26px] bg-raised items-center justify-center" onPress={() => router.back()}>
          <Text className="text-ink text-xl">←</Text>
        </PressableScale>
        <PressableScale className="bg-accent py-4 px-10 rounded-full" onPress={handleNext}>
          <Text className="text-ink text-base font-bold">{t.nextBtn}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    left: width / 2 - 1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: WorkoutTheme.accent.purple,
    zIndex: 10,
  },
});
