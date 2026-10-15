import { LinearGradient } from "expo-linear-gradient";
import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, Dimensions, ScrollView } from "react-native";
import { router } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
const { height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.38;

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError(t.fillAllFields);
      return;
    }
    try {
      setLoading(true);
      const response = await AuthService.login(email, password);
      await TokenService.save(response.access_token);
      router.replace("/(tabs)/explore");
    } catch (err: any) {
      setError(err.message || t.wrongCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScreenBackground />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.hero}>
          <Image
            source={require("@/assets/onboarding2.jpg")}
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", WorkoutTheme.background]}
            className="absolute inset-x-0 bottom-0 h-[75%]"
          />

          <View className="absolute top-14 left-6 flex-row gap-7">
            <View>
              <Text className="text-ink text-base font-semibold">{t.login}</Text>
              <View className="h-0.5 bg-accent rounded-full mt-1" />
            </View>
            <PressableScale onPress={() => router.replace("/(auth)/RegisterScreen")}>
              <Text className="text-ink-muted text-base">{t.signUp}</Text>
            </PressableScale>
          </View>

          <View className="absolute bottom-5 left-6 right-6">
            <Text className="text-ink text-[32px] font-light">{t.welcomeBack}</Text>
          </View>
        </View>

        <View className="px-6 pt-8">
          <View className="mb-4">
            <Text className="text-ink-muted text-sm mb-2 ml-5">{t.email}</Text>
            <View className="flex-row items-center h-14 rounded-full bg-surface px-5">
              <TextInput
                className="text-ink text-base flex-1 h-full"
                placeholder={t.emailPlaceholder}
                placeholderTextColor={WorkoutTheme.text.disabled}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {email.length > 0 && (
                <View className="w-[26px] h-[26px] rounded-full bg-accent items-center justify-center">
                  <Ionicons name="checkmark" size={14} color={WorkoutTheme.text.primary} />
                </View>
              )}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-ink-muted text-sm mb-2 ml-5">{t.passwordLabel}</Text>
            <View className="flex-row items-center h-14 rounded-full bg-surface px-5">
              <TextInput
                className="text-ink text-base flex-1 h-full"
                placeholder="••••••••"
                placeholderTextColor={WorkoutTheme.text.disabled}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                textContentType="oneTimeCode"
              />
              <PressableScale
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color={WorkoutTheme.text.disabled}
                />
              </PressableScale>
            </View>
          </View>

          <PressableScale className="self-end -mt-4 mb-2">
            <Text className="text-accent text-[13px]">{t.forgotPassword}</Text>
          </PressableScale>

          {error ? <Text className="text-danger text-[13px] text-center mt-2">{error}</Text> : null}
        </View>

        <View className="flex-row items-center px-6 pt-6 gap-3">
          <PressableScale className="w-14 h-14 rounded-full bg-raised items-center justify-center">
            <FontAwesome name="apple" size={22} color={WorkoutTheme.text.primary} />
          </PressableScale>
          <PressableScale className="w-14 h-14 rounded-full bg-raised items-center justify-center">
            <FontAwesome name="google" size={20} color={WorkoutTheme.text.primary} />
          </PressableScale>
          <PressableScale
            className="flex-1 h-14 bg-accent rounded-full flex-row items-center justify-center"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-ink text-base font-bold">
              {loading ? t.loadingEllipsis : t.login}
            </Text>
            {!loading && (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={WorkoutTheme.text.primary}
                style={{ marginLeft: 4 }}
              />
            )}
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  hero: { height: HERO_HEIGHT, position: "relative" },

});
