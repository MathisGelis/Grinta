import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { saveItem } from "@/core/services/storage";
import { router } from "expo-router";

export default function WelcomeScreen() {
  const handleStart = () => {
    saveItem("hasSeenWelcome", "true");
    router.push("/(auth)/LandingScreen");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Grinta 💪</Text>
      <Text style={styles.subtitle}>Let&apos;s get you started.</Text>
      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#7B61FF",
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
