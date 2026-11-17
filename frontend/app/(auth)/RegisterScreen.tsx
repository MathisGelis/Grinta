import { clearUserSession } from "@/services/session.service";
import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
import { saveItem } from "@/core/services/storage";
import { UserService } from "@/services/user.service";
import { takeOnboardingDraft } from "@/utils/onboardingDraft";
import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { router } from "expo-router";

import ScreenBackground from "@/components/ui/ScreenBackground";
import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
import AuthHero from "@/components/auth/AuthHero";
import PasswordField from "@/components/auth/PasswordField";
import { LIMITS, MIN_PASSWORD, isValidEmail } from "@/utils/validation";
import { useTranslation } from "@/contexts/LanguageContext";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!name || !email || !password) {
      setError(t.fillAllFields);
      return;
    }
    if (!isValidEmail(email)) {
      setError(t.invalidEmail);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(t.passwordTooShort);
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
      await clearUserSession();
      await TokenService.save(response.access_token);
      await saveItem("user_id", response.id);
      await saveItem("user_name", name);
      // Réponses du questionnaire : le compte existe déjà, un échec ici ne doit pas bloquer l'inscription.
      const profile = takeOnboardingDraft();
      if (Object.keys(profile).length > 0) {
        await UserService.updateProfile(response.id, profile).catch(() => {});
      }
      router.replace("/(auth)/onboarding/TemplatesScreen");
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AuthHero
          image={require("@/assets/onboarding1.jpg")}
          active="register"
          title={
            <>
              {t.helloNewbie} <Text className="font-bold">{t.newbieWord}</Text>
            </>
          }
          subtitle={t.registerIntro}
        />

        <View className="gap-5 px-5 pt-6">
          <FormField label={t.name}>
            <TextField
              icon="person-outline"
              placeholder={t.yourName}
              value={name}
              maxLength={LIMITS.displayName}
              onChangeText={setName}
            />
          </FormField>

          <FormField label={t.email}>
            <TextField
              icon="mail-outline"
              placeholder={t.emailPlaceholder}
              value={email}
              maxLength={LIMITS.email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </FormField>

          <View className="gap-2">
            <PasswordField
              label={t.passwordLabel}
              value={password}
              maxLength={LIMITS.password}
              onChangeText={setPassword}
            />
            <Text
              className={`ml-4 text-xs ${
                password.length > 0 && password.length < MIN_PASSWORD ? "text-danger" : "text-ink-muted"
              }`}
            >
              {t.passwordHint}
            </Text>
          </View>

          <PasswordField
            label={t.passwordAgain}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {error ? <Text className="text-center text-[13px] text-danger">{error}</Text> : null}

          <Button
            icon="person-add-outline"
            label={t.signUp}
            loading={loading}
            onPress={handleRegister}
          />
        </View>
      </ScrollView>
    </View>
  );
}
