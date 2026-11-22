import React, { useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenBackground from "@/components/ui/ScreenBackground";
import Screen from "@/components/ui/Screen";
import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
import { ApiError } from "@/services/api";
import { AuthService } from "@/services/auth.service";
import { MIN_PASSWORD } from "@/utils/validation";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"password" | "confirm", string>>>({});
  const [invalidLink, setInvalidLink] = useState(!token);

  const submit = async () => {
    setError("");
    const errors: typeof fieldErrors = {};
    if (password.length < MIN_PASSWORD) errors.password = t.passwordTooShort;
    else if (password !== confirm) errors.confirm = t.passwordsDontMatch;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setLoading(true);
      await AuthService.resetPassword(String(token), password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "RESET_TOKEN_INVALID") setInvalidLink(true);
      else if (err instanceof ApiError && err.fieldErrors?.password) setFieldErrors({ password: err.fieldErrors.password });
      else setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScreenBackground />
      <Screen tabBar={false} keyboardShouldPersistTaps="handled">
        <Text className="text-[28px] font-semibold text-ink">{t.resetTitle}</Text>
        {invalidLink ? (
          <>
            <Text className="text-sm text-danger">{t.resetTokenInvalid}</Text>
            <Button
              label={t.resetRequestNew}
              onPress={() => router.replace("/(auth)/ForgotPasswordScreen")}
            />
          </>
        ) : done ? (
          <>
            <Text className="text-sm text-ink-soft">{t.resetDone}</Text>
            <Button label={t.backToLogin} onPress={() => router.replace("/(auth)/LoginScreen")} />
          </>
        ) : (
          <>
            <Text className="text-sm text-ink-muted">{t.resetIntro}</Text>
            <FormField label={t.newPasswordLabel} error={fieldErrors.password}>
              <TextField
                icon="lock-closed-outline"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                textContentType="newPassword"
              />
              <Text className="ml-4 text-xs text-ink-muted">{t.passwordHint}</Text>
            </FormField>
            <FormField label={t.passwordAgain} error={fieldErrors.confirm}>
              <TextField
                icon="lock-closed-outline"
                placeholder="••••••••"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
                textContentType="newPassword"
              />
            </FormField>
            {error ? <Text className="text-center text-sm text-danger">{error}</Text> : null}
            <Button label={t.resetSubmit} loading={loading} onPress={submit} />
          </>
        )}
      </Screen>
    </View>
  );
}
