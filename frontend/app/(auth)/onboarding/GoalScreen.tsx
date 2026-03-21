import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { DrumRollPicker } from "@/components/DrumRollPicker";
import { UserService } from "@/services/user.service";
import { saveItem, getItem } from "@/core/services/storage";

const GOALS = [
  "Gain Weight",
  "Lose weight",
  "Get fitter",
  "Gain more flexible",
  "Learn the basic",
];

export default function GoalScreen() {
  const params = useLocalSearchParams<{
    gender: string;
    age: string;
    weight: string;
    height: string;
  }>();
  const [goalIndex, setGoalIndex] = useState(2);
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const userId = await getItem("user_id");
      if (userId) {
        const birthYear = new Date().getFullYear() - parseInt(params.age);
        await UserService.updateProfile(userId, {
          birthDate: `${birthYear}-01-01`,
          height: parseInt(params.height),
          weight: parseInt(params.weight),
        });
      }
      await saveItem("user_gender", params.gender);
      await saveItem("user_goal", GOALS[goalIndex]);
    } catch {
    } finally {
      setLoading(false);
      router.replace("/(tabs)/explore");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What&apos;s your goal?</Text>
      <Text style={styles.subtitle}>This helps us create your personalized plan</Text>

      <View style={styles.pickerWrapper}>
        <DrumRollPicker
          items={GOALS}
          selectedIndex={goalIndex}
          onSelect={setGoalIndex}
        />
      </View>

      <View style={styles.nav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleFinish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextText}>Next  ›</Text>
          )}
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
    minWidth: 130,
    alignItems: "center",
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
