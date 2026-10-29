import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

interface WorkoutTabsProps {
  activeTab: "infos" | "stats";
  onTabChange: (tab: "infos" | "stats") => void;
}

export default function WorkoutTabs({
  activeTab,
  onTabChange,
}: WorkoutTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "infos" && styles.activeTab]}
        onPress={() => onTabChange("infos")}
      >
        <Ionicons
          name="information-circle"
          size={16}
          color={
            activeTab === "infos"
              ? WorkoutTheme.accent.purple
              : WorkoutTheme.text.secondary
          }
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "infos" && styles.activeTabText,
          ]}
        >
          Infos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "stats" && styles.activeTab]}
        onPress={() => onTabChange("stats")}
      >
        <Ionicons
          name="bar-chart"
          size={16}
          color={
            activeTab === "stats"
              ? WorkoutTheme.accent.purple
              : WorkoutTheme.text.secondary
          }
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "stats" && styles.activeTabText,
          ]}
        >
          Stats
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: WorkoutTheme.border,
    backgroundColor: WorkoutTheme.backgroundTertiary,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: WorkoutTheme.accent.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: WorkoutTheme.text.secondary,
  },
  activeTabText: {
    color: WorkoutTheme.accent.purple,
  },
});
