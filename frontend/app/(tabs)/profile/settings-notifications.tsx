import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";

export default function SettingsNotificationsScreen() {
  const { t } = useTranslation();
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [programNotifs, setProgramNotifs] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.notificationsSettings}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.menuSection}>
        <View style={[styles.menuItem, styles.menuItemBorder]}>
          <Text style={styles.menuLabel}>{t.workoutReminders}</Text>
          <Switch
            value={workoutReminders}
            onValueChange={setWorkoutReminders}
            trackColor={{ false: "#3a3a3a", true: "#7B5CF0" }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>{t.programNotifications}</Text>
          <Switch
            value={programNotifs}
            onValueChange={setProgramNotifs}
            trackColor={{ false: "#3a3a3a", true: "#7B5CF0" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <Text style={styles.footer}>
        {t.phoneSettingsNote}{" "}
        <Text
          style={styles.footerLink}
          onPress={() => Linking.openSettings()}
        >
          {t.phoneSettingsLink}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  menuSection: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  menuLabel: { flex: 1, color: "#fff", fontSize: 15 },
  footer: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  footerLink: { color: "#7B5CF0" },
});
