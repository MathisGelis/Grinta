import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Screen from "@/components/ui/Screen";
import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
import { AuthService } from "@/services/auth.service";
import { isValidEmail } from "@/utils/validation";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!isValidEmail(email)) {
      setError(t.invalidEmail);
      return;
    }
    try {
      setLoading(true);
      await AuthService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScreenBackground />
      <ScreenHeader title={t.forgotTitle} />
      <Screen topInset={false} tabBar={false} keyboardShouldPersistTaps="handled">
        <Text className="text-sm text-ink-muted">{t.forgotIntro}</Text>
        <FormField label={t.email}>
          <TextField
            icon="mail-outline"
            placeholder={t.emailPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!sent}
          />
        </FormField>
        {error ? <Text className="text-center text-sm text-danger">{error}</Text> : null}
        {sent ? <Text className="text-center text-sm text-ink-soft">{t.forgotSent}</Text> : null}
        {sent ? (
          <Button label={t.backToLogin} onPress={() => router.replace("/(auth)/LoginScreen")} />
        ) : (
          <Button label={t.forgotSend} loading={loading} onPress={submit} />
        )}
      </Screen>
    </View>
  );
}
