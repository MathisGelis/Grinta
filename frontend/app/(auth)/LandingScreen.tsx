import { router } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Grinta 💪</Text>
      <Text style={styles.subtitle}>
        Track your workouts, connect with others, and push your limits.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/LoginScreen")}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/RegisterScreen")}
      >
        <Text style={styles.buttonText}>Register</Text>
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
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#bbb",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#7B61FF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
