import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ConnectionsService, UserListItem } from "@/services/connections.service";

export default function FollowersScreen() {
  const params = useLocalSearchParams<{ userId: string; tab: string }>();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    (params.tab as any) || "followers"
  );
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<UserListItem[]>([]);
  const [following, setFollowing] = useState<UserListItem[]>([]);

  useEffect(() => {
    if (!params.userId) return;
    setLoading(true);
    Promise.all([
      ConnectionsService.getFollowers(params.userId).catch(() => []),
      ConnectionsService.getFollowing(params.userId).catch(() => []),
    ])
      .then(([f, g]) => {
        setFollowers(f);
        setFollowing(g);
      })
      .finally(() => setLoading(false));
  }, [params.userId]);

  const list = activeTab === "followers" ? followers : following;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === "followers" ? "Followers" : "Following"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "followers" && styles.tabActive]}
          onPress={() => setActiveTab("followers")}
        >
          <Text style={[styles.tabText, activeTab === "followers" && styles.tabTextActive]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "following" && styles.tabActive]}
          onPress={() => setActiveTab("following")}
        >
          <Text style={[styles.tabText, activeTab === "following" && styles.tabTextActive]}>
            Following ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#7B5CF0" style={{ marginTop: 32 }} />
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={36} color="#444" />
            <Text style={styles.emptyText}>
              {activeTab === "followers" ? "Aucun follower" : "Aucun abonnement"}
            </Text>
          </View>
        ) : (
          list.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={styles.userCard}
              onPress={() => router.push({ pathname: "/(tabs)/profile/user-profile", params: { userId: u.id } } as any)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {u.displayName?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.displayName}>{u.displayName}</Text>
                <Text style={styles.uniqueName}>@{u.uniqueName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingBottom: 16,
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

  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#7B5CF0" },
  tabText: { color: "#888", fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  displayName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  uniqueName: { color: "#888", fontSize: 12, marginTop: 1 },

  empty: { alignItems: "center", marginTop: 48, gap: 10 },
  emptyText: { color: "#555", fontSize: 14 },
});
