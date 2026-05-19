import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";

export default function NotificationsScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.notifications}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
      >
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>{t.noNotifications}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "700" },
  empty: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyText: { color: "#555", fontSize: 16 },
});
