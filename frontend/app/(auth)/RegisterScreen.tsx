import { LinearGradient } from "expo-linear-gradient";
import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
import { saveItem } from "@/core/services/storage";
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image, Dimensions, ScrollView } from "react-native";
import { router } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { LIMITS } from "@/utils/validation";
import { useTranslation } from "@/contexts/LanguageContext";
const { height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.38;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!name || !email || !password) {
      setError(t.fillAllFields);
      return;
    }
    if (name.trim().length > LIMITS.displayName) {
      setError(t.nameTooLong);
      return;
    }
    if (email.trim().length > LIMITS.email) {
      setError(t.emailTooLong);
      return;
    }
    if (password.length > LIMITS.password) {
      setError(t.passwordTooLong);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordsDontMatch);
      return;
    }
    try {
      setLoading(true);
      const response = await AuthService.register(email, password, name);
      await TokenService.save(response.access_token);
      await saveItem("user_id", response.id);
      await saveItem("user_name", name);
      router.replace("/(auth)/onboarding/GenderScreen");
    } catch (err: any) {
      setError(err.message || t.genericError);
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
            source={require("@/assets/onboarding1.jpg")}
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", WorkoutTheme.background]}
            className="absolute inset-x-0 bottom-0 h-[75%]"
          />

          <View className="absolute top-14 left-6 flex-row gap-7">
            <PressableScale onPress={() => router.replace("/(auth)/LoginScreen")}>
              <Text className="text-ink-muted text-base">{t.login}</Text>
            </PressableScale>
            <View>
              <Text className="text-ink text-base font-semibold">{t.signUp}</Text>
              <View className="h-0.5 bg-accent rounded-full mt-1" />
            </View>
          </View>

          <View className="absolute bottom-5 left-6 right-6">
            <Text className="text-ink text-[28px] font-light mb-1.5">
              {t.helloNewbie} <Text className="font-bold">{t.newbieWord}</Text>
            </Text>
            <Text className="text-ink-muted text-[13px] leading-[20px]">
              {t.registerIntro}
            </Text>
          </View>
        </View>

        <View className="px-6 pt-7">
          <View className="mb-6">
            <Text className="text-accent text-xs mb-2">{t.name}</Text>
            <TextInput
              className="text-ink text-base py-1.5"
              placeholder={t.yourName}
              placeholderTextColor={WorkoutTheme.text.disabled}
              value={name}
              maxLength={LIMITS.displayName}
              onChangeText={setName}
            />
            <View className="h-[1px] bg-raised mt-1.5" />
          </View>

          <View className="mb-6">
            <Text className="text-accent text-xs mb-2">{t.email}</Text>
            <TextInput
              className="text-ink text-base py-1.5"
              placeholder={t.emailPlaceholder}
              placeholderTextColor={WorkoutTheme.text.disabled}
              value={email}
              maxLength={LIMITS.email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View className="h-[1px] bg-raised mt-1.5" />
          </View>

          <View className="mb-6">
            <Text className="text-accent text-xs mb-2">{t.passwordLabel}</Text>
            <View className="flex-row items-center h-14 rounded-full bg-surface px-5">
              <TextInput
                className="text-ink text-base flex-1 h-full"
                placeholder="••••••••"
                placeholderTextColor={WorkoutTheme.text.disabled}
                secureTextEntry={!showPassword}
                value={password}
                maxLength={LIMITS.password}
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
            <View className="h-[1px] bg-raised mt-1.5" />
          </View>

          <View className="mb-6">
            <Text className="text-accent text-xs mb-2">{t.passwordAgain}</Text>
            <View className="flex-row items-center h-14 rounded-full bg-surface px-5">
              <TextInput
                className="text-ink text-base flex-1 h-full"
                placeholder="••••••••"
                placeholderTextColor={WorkoutTheme.text.disabled}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                textContentType="oneTimeCode"
              />
              <PressableScale
                onPress={() => setShowConfirm((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirm ? "eye" : "eye-off"}
                  size={20}
                  color={WorkoutTheme.text.disabled}
                />
              </PressableScale>
            </View>
            <View className="h-[1px] bg-raised mt-1.5" />
          </View>

          {error ? <Text className="text-danger text-[13px] text-center mt-1 mb-1">{error}</Text> : null}
        </View>

        <View className="flex-row items-center px-6 pt-5 gap-3">
          <PressableScale className="w-14 h-14 rounded-full bg-raised items-center justify-center">
            <FontAwesome name="apple" size={22} color={WorkoutTheme.text.primary} />
          </PressableScale>
          <PressableScale className="w-14 h-14 rounded-full bg-raised items-center justify-center">
            <FontAwesome name="google" size={20} color={WorkoutTheme.text.primary} />
          </PressableScale>
          <PressableScale
            className="flex-1 h-14 bg-accent rounded-full flex-row items-center justify-center"
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-ink text-base font-bold">
              {loading ? t.loadingEllipsis : t.signUp}
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
