import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DrumRollPicker } from "@/components/DrumRollPicker";

const MIN_AGE = 10;
const MAX_AGE = 80;
const ages = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);
const DEFAULT_AGE = 25;

export default function AgeScreen() {
  const params = useLocalSearchParams<{ gender: string }>();
  const [ageIndex, setAgeIndex] = useState(DEFAULT_AGE - MIN_AGE);

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/WeightScreen",
      params: { gender: params.gender, age: String(ages[ageIndex]) },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How old are you ?</Text>
      <Text style={styles.subtitle}>This helps us create your personalized plan</Text>

      <View style={styles.pickerWrapper}>
        <DrumRollPicker
          items={ages}
          selectedIndex={ageIndex}
          onSelect={setAgeIndex}
        />
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
    marginBottom: 40,
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 48,
    paddingTop: 16,
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
