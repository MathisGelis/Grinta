import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";

type FilterKey = "new" | "events" | "all";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filters: { key: FilterKey; label: string }[] = [
    { key: "new", label: t.newFilter },
    { key: "events", label: t.events },
    { key: "all", label: t.all },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.notifications}</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
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

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
  },
  filterTabActive: { backgroundColor: "#7B5CF0" },
  filterText: { color: "#888", fontSize: 14, fontWeight: "500" },
  filterTextActive: { color: "#fff" },

  empty: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyText: { color: "#555", fontSize: 16 },
});
