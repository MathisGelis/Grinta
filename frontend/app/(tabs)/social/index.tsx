import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ConnectionsService, UserListItem, FollowRequest } from "@/services/connections.service";
import { UserService } from "@/services/user.service";

export default function SocialScreen() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<UserListItem[]>([]);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await UserService.getMe();
      setUserId(me.id);

      const [recs, followingData, requestsData] = await Promise.all([
        ConnectionsService.getRecommendations().catch(() => []),
        ConnectionsService.getFollowing(me.id).catch(() => []),
        ConnectionsService.getRequests().catch(() => []),
      ]);

      setRecommendations(recs);
      setFollowingIds(new Set(followingData.map((u) => u.id)));
      setRequests(requestsData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await ConnectionsService.searchUsers(searchQuery.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleFollow = async (targetId: string) => {
    try {
      const result = await ConnectionsService.follow(targetId);
      if (result.status === "FOLLOWING") {
        setFollowingIds((prev) => new Set([...prev, targetId]));
      } else if (result.status === "REQUEST_SENT") {
        setPendingIds((prev) => new Set([...prev, targetId]));
      }
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de follow");
    }
  };

  const handleUnfollow = async (targetId: string) => {
    try {
      await ConnectionsService.unfollow(targetId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible d'unfollow");
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await ConnectionsService.acceptRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await ConnectionsService.rejectRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur");
    }
  };

  const displayList = searchQuery.trim() ? searchResults : recommendations;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#555" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {/* Pending requests */}
        {!searchQuery.trim() && requests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Demandes ({requests.length})</Text>
            {requests.map((req) => (
              <View key={req.request_id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userInfo}
                  onPress={() => router.push({ pathname: "/(tabs)/profile/user-profile", params: { userId: req.user_id } } as any)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {req.user_displayName?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.displayName}>{req.user_displayName}</Text>
                    <Text style={styles.uniqueName}>@{req.user_uniqueName}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req.request_id)}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(req.request_id)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Main list */}
        {!searchQuery.trim() && (
          <Text style={styles.sectionTitle}>Suggestions</Text>
        )}
        {searchQuery.trim() && (
          <Text style={styles.sectionTitle}>Résultats</Text>
        )}

        {loading || searching ? (
          <ActivityIndicator size="small" color="#7B5CF0" style={{ marginTop: 24 }} />
        ) : displayList.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={searchQuery.trim() ? "search-outline" : "people-outline"}
              size={36}
              color="#444"
            />
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? "Aucun résultat" : "Aucune suggestion"}
            </Text>
          </View>
        ) : (
          displayList.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <TouchableOpacity
                style={styles.userInfo}
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
              </TouchableOpacity>
              {u.id !== userId && (
                followingIds.has(u.id) ? (
                  <TouchableOpacity style={styles.followingBtn} onPress={() => handleUnfollow(u.id)}>
                    <Text style={styles.followingBtnText}>Suivi</Text>
                  </TouchableOpacity>
                ) : pendingIds.has(u.id) ? (
                  <View style={styles.pendingBtn}>
                    <Text style={styles.pendingBtnText}>Envoyé</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(u.id)}>
                    <Text style={styles.followBtnText}>Suivre</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },

  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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

  followBtn: {
    backgroundColor: "#7B5CF0",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  followingBtn: {
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  followingBtnText: { color: "#888", fontSize: 12, fontWeight: "600" },
  pendingBtn: {
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  pendingBtnText: { color: "#555", fontSize: 12, fontWeight: "600" },

  acceptBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#34D399",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
  },

  empty: { alignItems: "center", marginTop: 48, gap: 10 },
  emptyText: { color: "#555", fontSize: 14 },
});
