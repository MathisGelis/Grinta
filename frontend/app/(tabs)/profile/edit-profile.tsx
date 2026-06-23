import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UserService, CurrentUser } from "@/services/user.service";
import { saveItem } from "@/core/services/storage";

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uniqueName, setUniqueName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    UserService.getMe()
      .then((me) => {
        setUser(me);
        setDisplayName(me.displayName);
        setUniqueName(me.uniqueName);
        setEmail(me.email);
      })
      .catch(() => Alert.alert("Erreur", "Impossible de charger le profil"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide");
      return;
    }
    if (!uniqueName.trim() || uniqueName.trim().length < 3) {
      Alert.alert("Erreur", "Le pseudo doit contenir au moins 3 caractères");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (displayName.trim() !== user.displayName) updates.displayName = displayName.trim();
      if (uniqueName.trim() !== user.uniqueName) updates.uniqueName = uniqueName.trim().toLowerCase();
      if (email.trim() !== user.email) updates.email = email.trim().toLowerCase();

      if (Object.keys(updates).length === 0) {
        router.back();
        return;
      }

      await UserService.updateProfile(user.id, updates);
      await saveItem("user_name", displayName.trim());
      Alert.alert("Succès", "Profil mis à jour", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de sauvegarder");
    } finally {
      setSaving(false);
    }
  };

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#7B5CF0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Votre nom"
              placeholderTextColor="#555"
            />
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pseudo</Text>
            <View style={styles.pseudoRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={uniqueName}
                onChangeText={(text) => setUniqueName(text.replace(/[^a-zA-Z0-9_]/g, ""))}
                placeholder="votre_pseudo"
                placeholderTextColor="#555"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.underline} />
            <Text style={styles.hint}>Min. 3 caractères, lettres, chiffres et _ uniquement</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.underline} />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Sauvegarde..." : "Sauvegarder"}</Text>
        </TouchableOpacity>
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

  avatarSection: { alignItems: "center", marginBottom: 40 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: "#7B5CF0",
  },
  avatarInner: {
    flex: 1,
    borderRadius: 48,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 28, fontWeight: "700" },
  cameraBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7B5CF0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
  },

  form: { paddingHorizontal: 24 },
  inputGroup: { marginBottom: 28 },
  label: { color: "#7B5CF0", fontSize: 12, marginBottom: 10 },
  input: { color: "#fff", fontSize: 16, paddingVertical: 6 },
  underline: { height: 1, backgroundColor: "#2a2a2a", marginTop: 6 },
  hint: { color: "#555", fontSize: 11, marginTop: 6 },

  pseudoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  atSign: {
    color: "#7B5CF0",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 4,
  },

  saveBtn: {
    marginHorizontal: 24,
    marginTop: 16,
    height: 54,
    backgroundColor: "#7B5CF0",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
