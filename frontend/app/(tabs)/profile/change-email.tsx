import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/ui/Screen";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
import { ApiError } from "@/services/api";
import { UserService } from "@/services/user.service";
import { LIMITS, isValidEmail } from "@/utils/validation";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";

/** Changement d'e-mail : mot de passe actuel, puis lien de confirmation envoyé à la nouvelle adresse. */
export default function ChangeEmailScreen() {
  const headerHeight = useFloatingHeaderHeight();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "password", string>>>({});

  const submit = async () => {
    setError("");
    const errors: typeof fieldErrors = {};
    if (!isValidEmail(email)) errors.email = t.invalidEmail;
    if (!password) errors.password = t.fillAllFields;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setLoading(true);
      await UserService.requestEmailChange(email, password);
      setSentTo(email.trim());
    } catch (err) {
      if (err instanceof ApiError && err.code === "CURRENT_PASSWORD_INVALID") {
        setFieldErrors({ password: t.pwCurrentInvalid });
      } else if (err instanceof ApiError && (err.code === "EMAIL_IN_USE" || err.code === "EMAIL_UNCHANGED")) {
        setFieldErrors({ email: err.message });
      } else {
        setError(err instanceof Error ? err.message : t.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScreenHeader floating title={t.emailChangeTitle} />
      <Screen topInset={false} tabBar={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: headerHeight }}>
        {sentTo ? (
          <>
            <Text className="text-sm text-ink-soft">{format(t.emailChangeSent, { email: sentTo })}</Text>
            <Button label={t.back} onPress={() => router.back()} />
          </>
        ) : (
          <>
            <Text className="text-sm text-ink-muted">{t.emailChangeIntro}</Text>
            <FormField label={t.emailNewLabel} error={fieldErrors.email}>
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
            <FormField label={t.pwCurrent} error={fieldErrors.password}>
              <TextField
                icon="lock-closed-outline"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                maxLength={LIMITS.password}
                textContentType="password"
                autoComplete="current-password"
              />
            </FormField>
            {error ? <Text className="text-center text-sm text-danger">{error}</Text> : null}
            <Button label={t.emailChangeSend} loading={loading} onPress={submit} />
          </>
        )}
      </Screen>
    </View>
  );
}
