import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";

export default function ChatScreen() {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: WorkoutTheme.background }]}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Ionicons
          name="paper-plane-outline"
          size={64}
          color={WorkoutTheme.accent.purple}
        />
        <Text style={styles.title}>Page à venir</Text>
        <Text style={styles.subtitle}>
          Cette fonctionnalité sera bientôt disponible
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: WorkoutTheme.backgroundSecondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: WorkoutTheme.text.secondary,
    marginTop: 8,
  },
});
