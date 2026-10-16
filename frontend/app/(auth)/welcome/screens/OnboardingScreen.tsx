import React, { useRef, useState } from "react";
import { View, FlatList, StyleSheet, Text, Animated, Dimensions } from "react-native";
import { slides } from "@/constants/slides";
import OnboardingSlide from "../components/OnboardingSlide";
import { router } from "expo-router";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentSlide(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleStart = () => {
    router.replace("/(auth)/LoginScreen");
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentSlide + 1 });
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <View className="flex-1">
      <ScreenBackground />
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => <OnboardingSlide item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      <View className="pb-12 pt-3 items-center bg-background">
        <View className="flex-row justify-center mb-6">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`w-6 h-1 rounded-sm mx-1 ${currentSlide === index ? "bg-accent" : "bg-ink-faint"}`}
            />
          ))}
        </View>

        <PressableScale
          style={styles.button}
          onPress={isLastSlide ? handleStart : handleNext}
        >
          <Text className="text-ink font-bold text-base">
            {isLastSlide ? t.startNowBtn : t.nextBtn}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: WorkoutTheme.accent.purple,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 40,
    width: width * 0.75,
    alignItems: "center",
  },
});
