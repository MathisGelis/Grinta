# Frontend Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 broken/missing frontend features so the Grinta app works with the updated backend (uniqueName, identifier-based login, network config, navigation superposition, and gradient metric rings).

**Architecture:** All changes are frontend-only (React Native / Expo Router). The backend has been updated to require `uniqueName` + `displayName` on registration, accept `identifier` (email OR uniqueName) at login, and return recommended usernames on conflict. The frontend needs to match these contracts.

**Tech Stack:** React Native 0.81.5, Expo 54, Expo Router 6, NativeWind, `expo-linear-gradient`, TypeScript

---

## File Map

| File | Action | Why |
|---|---|---|
| `frontend/.env` | Modify | Add `EXPO_PUBLIC_API_URL` (network failed) |
| `frontend/services/auth.service.ts` | Modify | `identifier` login + `displayName`/`uniqueName` register |
| `frontend/services/user.service.ts` | Modify | Support `displayName` + `uniqueName` in updateProfile |
| `frontend/app/(auth)/LoginScreen.tsx` | Modify | `identifier` field + page superposition fix |
| `frontend/app/(auth)/RegisterScreen.tsx` | Modify | Add `uniqueName` field, `displayName`, error suggestion |
| `frontend/app/(auth)/_layout.tsx` | Modify | Add `animation: "none"` to fix superposition |
| `frontend/app/(tabs)/profile/edit-profile.tsx` | Modify | Add `uniqueName` field, call backend PATCH, error display |
| `frontend/app/(tabs)/stats/index.tsx` | Modify | Fix gradient on big metric ring |
| `frontend/assets/` | Manual | User must place new image files (see Task 8) |
| `frontend/app/(auth)/welcome/data/slides.ts` | Modify | Update carousel image references |

---

## Task 1: Fix network — add EXPO_PUBLIC_API_URL to .env

**Files:**
- Modify: `frontend/.env`

The frontend defaults to `http://localhost:3000` which doesn't resolve from a physical device or Android emulator. The correct address must be set.

- [ ] **Step 1: Add the API URL variable**

Open `frontend/.env` and add at the top:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
```
Replace `YOUR_LOCAL_IP` with the LAN IP of the machine running the backend (e.g., `192.168.1.42`). You can find it with `ifconfig | grep "inet "` on macOS.

If the backend is deployed to a remote server, use the full URL (e.g., `https://api.grinta.app`).

- [ ] **Step 2: Restart the Expo dev server to pick up .env changes**

```bash
cd frontend && npx expo start --clear
```

Expected: The app no longer shows "Network request failed" when trying to log in.

---

## Task 2: Fix auth service — identifier login + displayName/uniqueName register

**Files:**
- Modify: `frontend/services/auth.service.ts`

The backend `/auth/login` now expects `{ identifier, password }` (not `{ email, password }`). The `/users/register` endpoint now expects `{ displayName, uniqueName, email, password }` (not `{ name, email, password }`).

- [ ] **Step 1: Update auth.service.ts**

Replace the entire content of `frontend/services/auth.service.ts` with:

```typescript
import { api } from "./api";

export interface LoginResponse {
  access_token: string;
}

export interface RegisterResponse {
  access_token: string;
  id: string;
}

export const AuthService = {
  login(identifier: string, password: string) {
    return api.post<LoginResponse>("/auth/login", { identifier, password });
  },

  async register(
    email: string,
    password: string,
    displayName: string,
    uniqueName: string
  ): Promise<RegisterResponse> {
    const user = await api.post<{ id: string }>("/users/register", {
      email,
      password,
      displayName,
      uniqueName,
    });

    const auth = await api.post<LoginResponse>("/auth/login", {
      identifier: email,
      password,
    });

    return { access_token: auth.access_token, id: user.id };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/services/auth.service.ts
git commit -m "fix: update auth service to use identifier login and displayName/uniqueName register"
```

---

## Task 3: Fix LoginScreen — identifier field + page superposition

**Files:**
- Modify: `frontend/app/(auth)/LoginScreen.tsx`
- Modify: `frontend/app/(auth)/_layout.tsx`

The login field should accept email OR @username. The "superposition" (both pages visible when switching) is caused by missing `animation: "none"` in the auth Stack.

- [ ] **Step 1: Fix auth layout — add animation: "none"**

Replace the content of `frontend/app/(auth)/_layout.tsx` with:

```typescript
import { Stack } from "expo-router";

export default function AuthNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="welcome/screens/SplashScreen" />
      <Stack.Screen name="welcome/screens/OnboardingScreen" />
      <Stack.Screen name="LandingScreen" />
      <Stack.Screen name="LoginScreen" />
      <Stack.Screen name="RegisterScreen" />
      <Stack.Screen name="onboarding/GenderScreen" />
      <Stack.Screen name="onboarding/AgeScreen" />
      <Stack.Screen name="onboarding/WeightScreen" />
      <Stack.Screen name="onboarding/HeightScreen" />
      <Stack.Screen name="onboarding/GoalScreen" />
    </Stack>
  );
}
```

- [ ] **Step 2: Update LoginScreen — rename email state to identifier, update label**

Replace the entire content of `frontend/app/(auth)/LoginScreen.tsx` with:

```typescript
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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!identifier || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    try {
      setLoading(true);
      const response = await AuthService.login(identifier, password);
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
            <Text style={styles.label}>Email or @username</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="your@email.com or @username"
                placeholderTextColor="#555"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {identifier.length > 0 && (
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
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/(auth)/_layout.tsx frontend/app/(auth)/LoginScreen.tsx
git commit -m "fix: login uses identifier field, auth stack animation none to fix superposition"
```

---

## Task 4: Fix RegisterScreen — add uniqueName field, displayName rename, error suggestion

**Files:**
- Modify: `frontend/app/(auth)/RegisterScreen.tsx`

The backend now requires `uniqueName` (min 3 chars, unique) and `displayName` (was `name`). If `uniqueName` is already taken, the backend returns an error message: `"Username already in use, recommended: <suggestion>"`. The frontend must parse this and display the suggestion.

- [ ] **Step 1: Replace RegisterScreen.tsx**

Replace the entire content of `frontend/app/(auth)/RegisterScreen.tsx` with:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/(auth)/RegisterScreen.tsx
git commit -m "feat: add uniqueName field to register, displayName rename, error suggestion"
```

---

## Task 5: Fix user service + edit profile — uniqueName field and backend sync

**Files:**
- Modify: `frontend/services/user.service.ts`
- Modify: `frontend/app/(tabs)/profile/edit-profile.tsx`

The edit profile screen currently only saves to local storage. It needs to:
1. Also call the backend PATCH `/users/{userId}` with `displayName` and `uniqueName`
2. Display the "username already in use, recommended: X" error with a tap-to-apply suggestion
3. Load `user_unique_name` from storage and let the user edit it

- [ ] **Step 1: Update user.service.ts**

Replace the entire content of `frontend/services/user.service.ts` with:

```typescript
import { api } from "./api";
import { TokenService } from "./token.service";

export const UserService = {
  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      uniqueName?: string;
      birthDate?: string;
      height?: number;
      weight?: number;
    }
  ) {
    const token = await TokenService.get();
    return api.patch<void>(`/users/${userId}`, data, token ?? undefined);
  },
};
```

- [ ] **Step 2: Replace edit-profile.tsx**

Replace the entire content of `frontend/app/(tabs)/profile/edit-profile.tsx` with:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add frontend/services/user.service.ts frontend/app/(tabs)/profile/edit-profile.tsx
git commit -m "feat: edit profile syncs uniqueName to backend, displays conflict suggestion"
```

---

## Task 6: Fix gradient metric ring in stats screen

**Files:**
- Modify: `frontend/app/(tabs)/stats/index.tsx`

The big calorie ring currently uses a flat `borderColor: "#7B5CF0"`. The fix adds a gradient effect using `expo-linear-gradient` (already available in Expo SDK) — wrapping the ring with a gradient circle and a transparent inner gap.

- [ ] **Step 1: Verify expo-linear-gradient is available**

```bash
cd frontend && npx expo install expo-linear-gradient
```

Expected: installs or confirms already installed.

- [ ] **Step 2: Update stats/index.tsx — gradient big ring**

At the top of `frontend/app/(tabs)/stats/index.tsx`, add the import:
```typescript
import { LinearGradient } from "expo-linear-gradient";
```

Replace the `bigRingSection` JSX block (lines 102–110) with:

```tsx
{/* Calorie ring */}
<View style={styles.bigRingSection}>
  <LinearGradient
    colors={["#7B5CF0", "#EC4899"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.bigRingGradient}
  >
    <View style={styles.bigRingInner}>
      <Text style={styles.bigRingValue}>745</Text>
      <Text style={styles.bigRingLabel}>Cal</Text>
    </View>
  </LinearGradient>
  <Text style={styles.bigRingCaption}>{t.dailyCaloriesBurned}</Text>
</View>
```

Replace the `bigRingOuter` and `bigRingInner` styles in the `StyleSheet` with:

```typescript
bigRingSection: { alignItems: "center", marginBottom: 32 },
bigRingGradient: {
  width: 180,
  height: 180,
  borderRadius: 90,
  padding: 14,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},
bigRingInner: {
  width: "100%",
  height: "100%",
  borderRadius: 90,
  backgroundColor: "#121212",
  alignItems: "center",
  justifyContent: "center",
},
bigRingValue: { color: "#fff", fontSize: 40, fontWeight: "700" },
bigRingLabel: { color: "#888", fontSize: 16 },
bigRingCaption: { color: "#555", fontSize: 13 },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/(tabs)/stats/index.tsx
git commit -m "feat: gradient ring for calorie metric using expo-linear-gradient"
```

---

## Task 7: Update onboarding carousel images

**Files:**
- Modify: `frontend/app/(auth)/welcome/data/slides.ts`
- Modify: `frontend/app/(auth)/LoginScreen.tsx` (hero image reference)
- Modify: `frontend/app/(auth)/RegisterScreen.tsx` (hero image reference)
- Manual: place new `.jpg` files in `frontend/assets/`

> **Note:** You must provide the actual image files. Place them in `frontend/assets/` before running this step.

- [ ] **Step 1: Add your new images to assets**

Place your new images in `frontend/assets/`:
- `sport1.jpg` — for the register/sign-up hero
- `sport2.jpg` — for the login hero
- `carousel1.jpg`, `carousel2.jpg`, `carousel3.jpg` — for the onboarding carousel

- [ ] **Step 2: Update slides.ts**

Replace the content of `frontend/app/(auth)/welcome/data/slides.ts`:

```typescript
export const slides = [
  {
    id: 1,
    image: require("@/assets/carousel1.jpg"),
    title: "Track your progress,",
    subtitle: "Push your limits",
  },
  {
    id: 2,
    image: require("@/assets/carousel2.jpg"),
    title: "Don't train alone,",
    subtitle: "Join the Grinta community",
  },
  {
    id: 3,
    image: require("@/assets/carousel3.jpg"),
    title: "Set your goals",
    subtitle: "Achieve them with Grinta",
  },
];
```

- [ ] **Step 3: Update image references in LoginScreen and RegisterScreen**

In `frontend/app/(auth)/LoginScreen.tsx`, change line:
```typescript
source={require("@/assets/onboarding2.jpg")}
```
to:
```typescript
source={require("@/assets/sport2.jpg")}
```

In `frontend/app/(auth)/RegisterScreen.tsx`, change line:
```typescript
source={require("@/assets/onboarding1.jpg")}
```
to:
```typescript
source={require("@/assets/sport1.jpg")}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/assets/ frontend/app/(auth)/welcome/data/slides.ts frontend/app/(auth)/LoginScreen.tsx frontend/app/(auth)/RegisterScreen.tsx
git commit -m "feat: update hero and carousel images"
```

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| Login/signup page superposition | Task 3 (animation: "none" in auth stack) |
| Change connection and carousel images | Task 7 |
| Network failed | Task 1 (EXPO_PUBLIC_API_URL) |
| Login by email OR uniqueName | Task 2 + 3 (identifier field) |
| uniqueName required at register, catch error, show suggestion | Task 4 |
| uniqueName in profile update, catch error, show suggestion | Task 5 |
| Fix gradient metric | Task 6 (expo-linear-gradient ring) |

All requirements covered. No placeholders remain for code tasks (Task 7 Step 1 is a deliberate manual handoff — you must provide the image files).
