import { isValidEmail } from "@/utils/validation";
import { clearUserSession } from "@/services/session.service";
import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { router } from "expo-router";

import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
import AuthHero from "@/components/auth/AuthHero";
import PasswordField from "@/components/auth/PasswordField";
import { useTranslation } from "@/contexts/LanguageContext";

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError(t.fillAllFields);
      return;
    }
    if (!isValidEmail(email) && email.includes("@")) {
      setError(t.invalidEmail);
      return;
    }
    try {
      setLoading(true);
      const response = await AuthService.login(email, password);
      await clearUserSession();
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AuthHero
          image={require("@/assets/onboarding2.jpg")}
          active="login"
          title={t.welcomeBack}
        />

        <View className="gap-5 px-5 pt-6">
          <FormField label={t.email}>
            <TextField
              icon="mail-outline"
              placeholder={t.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </FormField>

          <PasswordField label={t.passwordLabel} value={password} onChangeText={setPassword} />

          <PressableScale
            className="-mt-2 self-end"
            halo={false}
            onPress={() => router.push("/(auth)/ForgotPasswordScreen")}
          >
            <Text className="text-[13px] text-accent-light">{t.forgotPassword}</Text>
          </PressableScale>

          {error ? <Text className="text-center text-[13px] text-danger">{error}</Text> : null}

          <Button
            icon="log-in-outline"
            label={t.login}
            loading={loading}
            onPress={handleLogin}
          />
        </View>
      </ScrollView>
    </View>
  );
}
