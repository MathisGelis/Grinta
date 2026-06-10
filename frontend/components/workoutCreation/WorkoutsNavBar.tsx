import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Text, Animated } from "react-native";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const NAV_TABS = [
  { label: "Séances", route: "/(tabs)/workouts" },
  { label: "Programmes", route: "/(tabs)/workouts/programms" },
  { label: "Exercices", route: "/(tabs)/workouts/exercises" },
];

export function WorkoutsNavBar() {
  const pathname = usePathname();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);

  const getActiveIndex = () => {
    if (pathname.includes("exercises")) return 2;
    if (pathname.includes("programms")) return 1;
    return 0;
  };

  const activeIndex = getActiveIndex();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: activeIndex,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  return (
    <SafeAreaView edges={["top"]} className="bg-[#0F0F0F]">
      <View
        className="flex flex-row bg-[#2e2e2e] rounded-full p-1 items-center justify-center mx-4 mb-4"
        onLayout={(e) => {
          const totalWidth = e.nativeEvent.layout.width;
          setTabWidth(totalWidth / NAV_TABS.length);
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            left: 4,
            width: `${96 / NAV_TABS.length}%`,
            height: "100%",
            transform: [{ translateX }],
          }}
          className="bg-violet-600 rounded-full"
        />

        {NAV_TABS.map(({ label, route }, index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={route}
              onPress={() => router.navigate(route)}
              className="flex-1 py-2 px-3 rounded-full z-10"
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
