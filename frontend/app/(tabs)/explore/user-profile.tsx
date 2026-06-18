import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { UserService, UserProfile } from "@/services/user.service";
import { ConnectionsService } from "@/services/connections.service";

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followStatus, setFollowStatus] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!params.userId) return;
    try {
      setLoading(true);
      const data = await UserService.getProfile(params.userId);
      setProfile(data);
      setFollowStatus(data.followStatus);
    } catch {
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  }, [params.userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!params.userId) return;
    setActionLoading(true);
    try {
      const result = await ConnectionsService.follow(params.userId);
      setFollowStatus(result.status === "FOLLOWING" ? "FOLLOWING" : "REQUEST_SENT");
      if (result.status === "FOLLOWING" && profile) {
        setProfile({ ...profile, followersCount: profile.followersCount + 1 });
      }
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!params.userId) return;
    setActionLoading(true);
    try {
      await ConnectionsService.unfollow(params.userId);
      setFollowStatus("FOLLOW");
      if (profile) {
        setProfile({ ...profile, followersCount: Math.max(0, profile.followersCount - 1) });
      }
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const initials = profile?.displayName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const renderFollowButton = () => {
    if (followStatus === "SELF") return null;
    if (followStatus === "FOLLOWING") {
      return (
        <TouchableOpacity style={styles.unfollowBtn} onPress={handleUnfollow} disabled={actionLoading}>
          <Text style={styles.unfollowBtnText}>{actionLoading ? "..." : "Suivi"}</Text>
        </TouchableOpacity>
      );
    }
    if (followStatus === "REQUEST_SENT") {
      return (
        <View style={styles.pendingBtn}>
          <Text style={styles.pendingBtnText}>Demande envoyée</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.followBtn} onPress={handleFollow} disabled={actionLoading}>
        <Text style={styles.followBtnText}>
          {actionLoading ? "..." : followStatus === "FOLLOW_BACK" ? "Suivre en retour" : "Suivre"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile?.uniqueName ? `@${profile.uniqueName}` : "Profil"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7B5CF0" style={{ marginTop: 60 }} />
      ) : profile ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.userName}>{profile.displayName}</Text>
            <Text style={styles.pseudoText}>@{profile.uniqueName}</Text>
          </View>

          {/* Follow button */}
          <View style={styles.followSection}>
            {renderFollowButton()}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push({ pathname: "/(tabs)/profile/followers", params: { userId: params.userId, tab: "followers" } } as any)}
            >
              <Text style={styles.statNum}>{profile.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push({ pathname: "/(tabs)/profile/followers", params: { userId: params.userId, tab: "following" } } as any)}
            >
              <Text style={styles.statNum}>{profile.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{profile.workoutsCount}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
          </View>

          {/* Private notice */}
          {profile.isPrivate && (
            <View style={styles.privateCard}>
              <Ionicons name="lock-closed" size={20} color="#888" />
              <Text style={styles.privateText}>Ce profil est privé</Text>
            </View>
          )}
        </ScrollView>
      ) : null}
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },

  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    backgroundColor: "#7B5CF0",
    marginBottom: 12,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 44,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 26, fontWeight: "700" },
  userName: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 2 },
  pseudoText: { color: "#7B5CF0", fontSize: 14, fontWeight: "500" },

  followSection: { alignItems: "center", marginBottom: 20 },
  followBtn: {
    backgroundColor: "#7B5CF0",
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  unfollowBtn: {
    backgroundColor: "transparent",
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  unfollowBtnText: { color: "#888", fontSize: 14, fontWeight: "600" },
  pendingBtn: {
    backgroundColor: "transparent",
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  pendingBtnText: { color: "#555", fontSize: 14, fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  statLabel: { color: "#888", fontSize: 12 },
  statDivider: { width: 1, backgroundColor: "#2a2a2a" },

  privateCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
    gap: 8,
  },
  privateText: { color: "#888", fontSize: 14 },
});
