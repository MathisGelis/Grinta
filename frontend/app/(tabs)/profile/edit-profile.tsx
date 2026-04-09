import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getItem, saveItem } from "@/core/services/storage";
import { UserService } from "@/services/user.service";

function parseUniqueNameError(message: string): {
  isUniqueName: boolean;
  suggested?: string;
} {
  if (message.startsWith("Username already in use, recommended:")) {
    const suggested = message.split("recommended:")[1]?.trim();
    return { isUniqueName: true, suggested };
  }
  return { isUniqueName: false };
}

export default function EditProfileScreen() {
  const [displayName, setDisplayName] = useState("");
  const [uniqueName, setUniqueName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getItem("user_name"),
      getItem("user_unique_name"),
      getItem("user_email"),
    ]).then(([n, u, e]) => {
      if (n) setDisplayName(n);
      if (u) setUniqueName(u);
      if (e) setEmail(e);
    });
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Le nom ne peut pas être vide");
      return;
    }
    if (uniqueName.trim() && uniqueName.trim().length < 3) {
      setError("Le nom d'utilisateur doit faire au moins 3 caractères");
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestedName(null);
    try {
      const userId = await getItem("user_id");
      if (userId) {
        await UserService.updateProfile(userId, {
          displayName: displayName.trim(),
          ...(uniqueName.trim() ? { uniqueName: uniqueName.trim() } : {}),
        });
      }
      await saveItem("user_name", displayName.trim());
      if (uniqueName.trim()) await saveItem("user_unique_name", uniqueName.trim());
      if (email.trim()) await saveItem("user_email", email.trim());
      Alert.alert("Success", "Profile updated", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message = err.message || "Could not save profile";
      const parsed = parseUniqueNameError(message);
      if (parsed.isUniqueName) {
        setError("Ce nom d'utilisateur est déjà pris.");
        if (parsed.suggested) setSuggestedName(parsed.suggested);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

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
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your full name"
              placeholderTextColor="#555"
            />
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={uniqueName}
                onChangeText={(v) => {
                  setSuggestedName(null);
                  setUniqueName(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                }}
                placeholder="yourhandle"
                placeholderTextColor="#555"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.underline} />
            {suggestedName && (
              <TouchableOpacity
                style={styles.suggestionBtn}
                onPress={() => {
                  setUniqueName(suggestedName);
                  setSuggestedName(null);
                  setError(null);
                }}
              >
                <Text style={styles.suggestionText}>
                  Suggestion:{" "}
                  <Text style={styles.suggestionHandle}>@{suggestedName}</Text>{" "}
                  — Tap to use
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.underline} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>
            {loading ? "Saving..." : "Save Changes"}
          </Text>
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
  inputRow: { flexDirection: "row", alignItems: "center" },
  atSign: { color: "#7B5CF0", fontSize: 16, marginRight: 4, paddingVertical: 6 },
  input: { color: "#fff", fontSize: 16, paddingVertical: 6 },
  underline: { height: 1, backgroundColor: "#2a2a2a", marginTop: 6 },
  suggestionBtn: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7B5CF055",
  },
  suggestionText: { color: "#aaa", fontSize: 12 },
  suggestionHandle: { color: "#7B5CF0", fontWeight: "600" },
  error: { color: "#ff6b6b", fontSize: 13, marginTop: 4, marginBottom: 8 },

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
