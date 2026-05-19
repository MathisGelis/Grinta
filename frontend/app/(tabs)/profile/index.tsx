import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getItem } from "@/core/services/storage";
import { AuthService } from "@/services/auth.service";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [userName, setUserName] = useState("Athlete");

  const MENU_ITEMS = [
    { id: "edit", label: t.editProfile, icon: "person-outline" as const, route: "/(tabs)/profile/edit-profile" },
    { id: "privacy", label: t.privacyPolicy, icon: "shield-checkmark-outline" as const, route: "/(tabs)/profile/privacy-policy" },
    { id: "settings", label: t.settings, icon: "settings-outline" as const, route: "/(tabs)/profile/settings" },
  ];

  useEffect(() => {
    getItem("user_name").then((name) => {
      if (name) setUserName(name);
    });
  }, []);

  const handleSignOut = () => {
    Alert.alert(t.signOutConfirmTitle, t.signOutConfirmMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.signOut,
        style: "destructive",
        onPress: async () => {
          await AuthService.logout();
          router.replace("/(auth)/LoginScreen");
        },
      },
    ]);
  };

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.profile}</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.joinedText}>{t.joined} March 2025</Text>
        </View>


        {/* PRO card */}
        <TouchableOpacity style={styles.proCard}>
          <View>
            <Text style={styles.proTitle}>{t.upgradeToPro}</Text>
            <Text style={styles.proSub}>{t.unlockAll}</Text>
          </View>
          <View style={styles.proBadge}>
            <MaterialCommunityIcons name="crown" size={18} color="#F59E0B" />
          </View>
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color="#7B5CF0" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 8 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "700" },

  avatarSection: { alignItems: "center", paddingVertical: 24 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: "#7B5CF0",
    marginBottom: 12,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 48,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 28, fontWeight: "700" },
  userName: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  joinedText: { color: "#888", fontSize: 13 },

  proCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F59E0B44",
  },
  proTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  proSub: { color: "#888", fontSize: 13 },
  proBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F59E0B22",
    alignItems: "center",
    justifyContent: "center",
  },

  menuSection: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    gap: 14,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500" },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
  },
  signOutText: { color: "#FF6B6B", fontSize: 15, fontWeight: "600" },
});
