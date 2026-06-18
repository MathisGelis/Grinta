import { router } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Text style={styles.logo}>Grinta</Text>
      <Text style={styles.tagline}>Your fitness journey starts here.</Text>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/LoginScreen")}
        >
          <Text style={styles.primaryButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/RegisterScreen")}
        >
          <Text style={styles.secondaryButtonText}>Create account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#A56BFF",
    marginBottom: 12,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: "#888",
    marginBottom: 64,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    gap: 14,
  },
  primaryButton: {
    backgroundColor: "#A56BFF",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A56BFF",
  },
  secondaryButtonText: {
    color: "#A56BFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
