import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    try {
      setLoading(true);
      const response = await AuthService.login(email, password);
      await TokenService.save(response.access_token);
      router.replace("/(tabs)/explore");
    } catch (err: any) {
      setError(err.message || "Identifiants incorrects");
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
            source={require("@/assets/onboarding2.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={[styles.overlay, { height: "100%", opacity: 0.2 }]} />
          <View style={[styles.overlay, { height: "70%", opacity: 0.4 }]} />
          <View style={[styles.overlay, { height: "45%", opacity: 0.6 }]} />
          <View style={[styles.overlay, { height: "20%", opacity: 0.9 }]} />

          {/* Tabs */}
          <View style={styles.tabs}>
            <View>
              <Text style={styles.tabActive}>Login</Text>
              <View style={styles.tabUnderline} />
            </View>
            <TouchableOpacity onPress={() => router.replace("/(auth)/RegisterScreen")}>
              <Text style={styles.tabInactive}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Welcome back</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="your@email.com"
                placeholderTextColor="#555"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {email.length > 0 && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </View>
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

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password</Text>
          </TouchableOpacity>

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
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.mainBtnText}>
              {loading ? "Loading..." : "Login"}
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
  heroTitle: { color: "#fff", fontSize: 32, fontWeight: "300" },

  form: { paddingHorizontal: 24, paddingTop: 32 },
  inputGroup: { marginBottom: 32 },
  label: { color: "#7B5CF0", fontSize: 12, marginBottom: 10 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: {
    color: "#fff",
    fontSize: 16,
    paddingVertical: 6,
  },
  underline: { height: 1, backgroundColor: "#2a2a2a", marginTop: 8 },
  checkmark: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#7B5CF0",
    alignItems: "center",
    justifyContent: "center",
  },
  forgotBtn: { alignSelf: "flex-end", marginTop: -16, marginBottom: 8 },
  forgotText: { color: "#7B5CF0", fontSize: 13 },
  error: {
    color: "#ff6b6b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },

  bottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
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
