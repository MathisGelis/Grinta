import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";

import { WorkoutTheme } from "@/constants/Colors";
const { width, height } = Dimensions.get("window");

export default function OnboardingSlide({ item }: { item: any }) {
  return (
    <View style={[styles.container, { width }]}>
      <Image source={item.image} className="w-full h-full absolute" resizeMode="cover" />
      <View className="absolute bottom-0 left-0 right-0 h-[50%] bg-scrim" />
      <View className="absolute bottom-9 left-6 right-6">
        <Text className="text-[22px] text-ink opacity-[0.9] mb-1">{item.title}</Text>
        <Text className="text-2xl text-ink font-bold">{item.subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height * 0.75,
    backgroundColor: WorkoutTheme.background,
    overflow: "hidden",
  },
});
