import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";

export default function SettingsContactScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.contactUs}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => Linking.openURL("mailto:support@grinta.app")}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="mail-outline" size={20} color="#7B5CF0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>support@grinta.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => Linking.openURL("https://instagram.com/grinta.app")}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="logo-instagram" size={20} color="#7B5CF0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Instagram</Text>
            <Text style={styles.contactValue}>@grinta.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </TouchableOpacity>
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
  card: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    overflow: "hidden",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { color: "#888", fontSize: 12, marginBottom: 2 },
  contactValue: { color: "#fff", fontSize: 15, fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#2a2a2a", marginHorizontal: 20 },
});
