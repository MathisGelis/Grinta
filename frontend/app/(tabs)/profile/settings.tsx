import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";

export default function SettingsScreen() {
  const { t } = useTranslation();

  const items = [
    {
      label: t.unitsOfMeasure,
      icon: "scale-outline" as const,
      route: "/(tabs)/profile/settings-units",
    },
    {
      label: t.notificationsSettings,
      icon: "notifications-outline" as const,
      route: "/(tabs)/profile/settings-notifications",
    },
    {
      label: t.language,
      icon: "language-outline" as const,
      route: "/(tabs)/profile/settings-language",
    },
    {
      label: t.contactUs,
      icon: "mail-outline" as const,
      route: "/(tabs)/profile/settings-contact",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.menuSection}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < items.length - 1 && styles.menuItemBorder]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={20} color="#7B5CF0" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        ))}
      </View>
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
    gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500" },
});
