import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/contexts/LanguageContext";
import { clearAll } from "@/core/services/storage";
import { TokenService } from "@/services/token.service";
import { UserService } from "@/services/user.service";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);

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

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      await UserService.deleteAccount();
      // The account is gone: nothing cached locally should outlive it.
      await TokenService.remove();
      await clearAll();
      router.replace("/(auth)/LandingScreen");
    } catch (error) {
      Alert.alert(
        t.error,
        error instanceof Error ? error.message : t.error,
      );
    } finally {
      setDeleting(false);
    }
  };

  // Two steps on purpose: this is irreversible and sits one tap from Settings.
  const confirmDelete = () => {
    Alert.alert(t.deleteAccount, t.deleteAccountMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.deleteAccount,
        style: "destructive",
        onPress: () =>
          Alert.alert(t.deleteAccount, t.deleteAccountFinal, [
            { text: t.cancel, style: "cancel" },
            {
              text: t.deleteAccount,
              style: "destructive",
              onPress: deleteAccount,
            },
          ]),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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

      <TouchableOpacity
        style={[styles.dangerItem, { marginBottom: insets.bottom + 112 }]}
        onPress={confirmDelete}
        disabled={deleting}
        activeOpacity={0.8}
      >
        <View style={styles.dangerIconWrap}>
          {deleting ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          )}
        </View>
        <Text style={styles.dangerLabel}>{t.deleteAccount}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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
  dangerItem: {
    marginTop: "auto",
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3A2020",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  dangerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2E1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerLabel: { flex: 1, color: "#FF6B6B", fontSize: 15, fontWeight: "600" },
});
