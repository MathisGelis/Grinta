import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
import { saveItem } from "@/core/services/storage";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.38;

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

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [uniqueName, setUniqueName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [suggestedName, setSuggestedName] = useState<string | null>(null);

  const handleRegister = async () => {
    setError("");
    setSuggestedName(null);
    if (!displayName || !uniqueName || !email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (uniqueName.length < 3) {
      setError("Le nom d'utilisateur doit faire au moins 3 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      setLoading(true);
      const response = await AuthService.register(
        email,
        password,
        displayName,
        uniqueName
      );
      await TokenService.save(response.access_token);
      await saveItem("user_id", response.id);
      await saveItem("user_name", displayName);
      await saveItem("user_unique_name", uniqueName);
      router.replace("/(auth)/onboarding/GenderScreen");
    } catch (err: any) {
      const message = err.message || "Une erreur est survenue";
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero section */}
        <View style={styles.hero}>
          <Image
            source={require("@/assets/onboarding1.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={[styles.overlay, { height: "100%", opacity: 0.2 }]} />
          <View style={[styles.overlay, { height: "70%", opacity: 0.4 }]} />
          <View style={[styles.overlay, { height: "45%", opacity: 0.6 }]} />
          <View style={[styles.overlay, { height: "20%", opacity: 0.9 }]} />

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => router.replace("/(auth)/LoginScreen")}>
              <Text style={styles.tabInactive}>Login</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.tabActive}>Sign up</Text>
              <View style={styles.tabUnderline} />
            </View>
          </View>

          {/* Title */}
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              Hello <Text style={{ fontWeight: "bold" }}>newbie,</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Enter your informations below or{"\n"}login with a other account
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#555"
              value={displayName}
              onChangeText={setDisplayName}
            />
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="yourhandle"
                placeholderTextColor="#555"
                value={uniqueName}
                onChangeText={(v) => {
                  setSuggestedName(null);
                  setUniqueName(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                }}
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
                  setError("");
                }}
              >
                <Text style={styles.suggestionText}>
                  Suggestion: <Text style={styles.suggestionHandle}>@{suggestedName}</Text> — Tap to use
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#555"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                textContentType="oneTimeCode"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.underline} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password again</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#555"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                textContentType="oneTimeCode"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirm ? "eye" : "eye-off"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.underline} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {/* Bottom actions */}
        <View style={styles.bottom}>
          <TouchableOpacity style={styles.socialBtn}>
            <FontAwesome name="apple" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <FontAwesome name="google" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.mainBtnText}>
              {loading ? "Loading..." : "Sign up"}
            </Text>
            {!loading && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#fff"
                style={{ marginLeft: 4 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scroll: { flex: 1 },

  hero: { height: HERO_HEIGHT, position: "relative" },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#121212",
  },
  tabs: {
    position: "absolute",
    top: 56,
    left: 24,
    flexDirection: "row",
    gap: 28,
  },
  tabActive: { color: "#fff", fontSize: 16, fontWeight: "600" },
  tabInactive: { color: "#888", fontSize: 16 },
  tabUnderline: {
    height: 2,
    backgroundColor: "#7B5CF0",
    borderRadius: 1,
    marginTop: 4,
  },
  heroText: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
  },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "300", marginBottom: 6 },
  heroSubtitle: { color: "#aaa", fontSize: 13, lineHeight: 20 },

  form: { paddingHorizontal: 24, paddingTop: 28 },
  inputGroup: { marginBottom: 24 },
  label: { color: "#7B5CF0", fontSize: 12, marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  atSign: { color: "#7B5CF0", fontSize: 16, marginRight: 4, paddingVertical: 6 },
  input: {
    color: "#fff",
    fontSize: 16,
    paddingVertical: 6,
  },
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
  error: {
    color: "#ff6b6b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 4,
  },

  bottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtn: {
    flex: 1,
    height: 52,
    backgroundColor: "#7B5CF0",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
