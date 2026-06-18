import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function OnboardingSlide({ item }: { item: any }) {
  return (
    <View style={[styles.container, { width }]}>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
      {/* Dark gradient overlay at the bottom */}
      <View style={styles.overlay} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height * 0.75,
    backgroundColor: "#121212",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  textContainer: {
    position: "absolute",
    bottom: 36,
    left: 24,
    right: 24,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
});
