import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const CIRCLE = 140;

export default function GenderScreen() {
  const [selected, setSelected] = useState<"male" | "female" | null>(null);

  const handleNext = () => {
    if (!selected) return;
    router.push({
      pathname: "/(auth)/onboarding/AgeScreen",
      params: { gender: selected },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tell us about yourself!</Text>
      <Text style={styles.subtitle}>
        To give you a better experience we need{"\n"}to know your gender
      </Text>

      <View style={styles.circles}>
        <TouchableOpacity
          style={[styles.circle, selected === "male" && styles.circleActive]}
          onPress={() => setSelected("male")}
        >
          <MaterialCommunityIcons
            name="gender-male"
            size={56}
            color={selected === "male" ? "#fff" : "#888"}
          />
          <Text style={[styles.label, selected === "male" && styles.labelActive]}>
            Male
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circle, selected === "female" && styles.circleActive]}
          onPress={() => setSelected("female")}
        >
          <MaterialCommunityIcons
            name="gender-female"
            size={56}
            color={selected === "female" ? "#fff" : "#888"}
          />
          <Text style={[styles.label, selected === "female" && styles.labelActive]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.nav}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected}
        >
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
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 60,
  },
  circles: {
    alignItems: "center",
    gap: 24,
    flex: 1,
    justifyContent: "center",
    marginTop: -40,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  circleActive: {
    backgroundColor: "#7B5CF0",
  },
  label: {
    color: "#888",
    fontSize: 15,
    marginTop: 4,
  },
  labelActive: {
    color: "#fff",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 48,
    paddingTop: 16,
  },
  nextBtn: {
    backgroundColor: "#7B5CF0",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 40,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
