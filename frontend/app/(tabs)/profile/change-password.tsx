import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/ui/Screen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
import { ApiError } from "@/services/api";
import { UserService } from "@/services/user.service";
import { LIMITS, MIN_PASSWORD } from "@/utils/validation";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!current) {
      setError(t.pwCurrentInvalid);
      return;
    }
    if (next.length < MIN_PASSWORD) {
      setError(t.passwordTooShort);
      return;
    }
    if (next === current) {
      setError(t.pwSameAsCurrent);
      return;
    }
    if (next !== confirm) {
      setError(t.passwordsDontMatch);
      return;
    }
    try {
      setLoading(true);
      // Un 400 (et non un 401) : l'app ne déconnecte pas l'utilisateur sur ce code.
      await UserService.changePassword(current, next);
      Alert.alert(t.pwChange, t.pwChanged, [{ text: t.ok, onPress: () => router.back() }]);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CURRENT_PASSWORD_INVALID") setError(t.pwCurrentInvalid);
      else setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScreenHeader title={t.pwChange} />
      <Screen topInset={false} tabBar={false} keyboardShouldPersistTaps="handled">
        <FormField label={t.pwCurrent}>
          <TextField
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
            value={current}
            onChangeText={setCurrent}
            maxLength={LIMITS.password}
            textContentType="password"
            autoComplete="current-password"
          />
        </FormField>
        <FormField label={t.pwNew}>
          <TextField
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
            value={next}
            onChangeText={setNext}
            maxLength={LIMITS.password}
            textContentType="newPassword"
            autoComplete="new-password"
          />
          <Text className="ml-4 text-xs text-ink-muted">{t.passwordHint}</Text>
        </FormField>
        <FormField label={t.passwordAgain}>
          <TextField
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            maxLength={LIMITS.password}
            textContentType="newPassword"
          />
        </FormField>
        {error ? <Text className="text-center text-sm text-danger">{error}</Text> : null}
        <Button label={t.pwChangeSubmit} loading={loading} onPress={submit} />
      </Screen>
    </View>
  );
}
