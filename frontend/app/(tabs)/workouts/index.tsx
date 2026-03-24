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

interface NotifItem {
  id: number;
  titleKey: string;
  bodyKey: string;
  time: string;
  read: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  isEvent?: boolean;
}

const NOTIF_DATA: NotifItem[] = [
  { id: 1, titleKey: "notif1Title", bodyKey: "notif1Body", time: "2 min", read: false, icon: "barbell-outline" },
  { id: 2, titleKey: "notif2Title", bodyKey: "notif2Body", time: "1h", read: false, icon: "trophy-outline" },
  { id: 3, titleKey: "notif3Title", bodyKey: "notif3Body", time: "3h", read: false, icon: "people-outline", isEvent: true },
  { id: 4, titleKey: "notif4Title", bodyKey: "notif4Body", time: "Yesterday", read: true, icon: "alarm-outline" },
  { id: 5, titleKey: "notif5Title", bodyKey: "notif5Body", time: "2d", read: true, icon: "flash-outline" },
];

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [dismissed, setDismissed] = useState<number[]>([]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "new", label: t.newFilter },
    { key: "events", label: t.events },
    { key: "all", label: t.all },
  ];

  const visible = NOTIF_DATA.filter((n) => {
    if (dismissed.includes(n.id)) return false;
    if (activeFilter === "new") return !n.read;
    if (activeFilter === "events") return !!n.isEvent;
    return true;
  });

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
        {visible.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>{t.noNotifications}</Text>
          </View>
        )}
        {visible.map((n) => {
          const title = (t as any)[n.titleKey] as string;
          const body = (t as any)[n.bodyKey] as string;
          return (
            <View key={n.id} style={styles.notifCard}>
              <View style={styles.iconWrap}>
                <Ionicons name={n.icon} size={22} color="#7B5CF0" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle}>{title}</Text>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBody}>{body}</Text>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDismissed((prev) => [...prev, n.id])}
                style={styles.dismissBtn}
              >
                <Ionicons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>
          );
        })}
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

  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  notifTitle: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7B5CF0" },
  notifBody: { color: "#888", fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notifTime: { color: "#555", fontSize: 12 },
  dismissBtn: { padding: 4 },

  empty: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyText: { color: "#555", fontSize: 16 },
});
