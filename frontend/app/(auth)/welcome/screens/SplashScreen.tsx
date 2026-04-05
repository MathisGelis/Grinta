import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        router.replace("/(auth)/welcome/screens/OnboardingScreen");
      }, 1500);
    });
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.logo, { opacity }]}>Grinta</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  logo: {
    fontSize: 42,
    color: "#A56BFF",
    fontWeight: "bold",
  },
});
