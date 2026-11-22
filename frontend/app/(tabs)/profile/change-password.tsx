import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/ui/Screen";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import Button from "@/components/ui/Button";
import { FormField, TextField } from "@/components/ui/FormField";
import { ApiError } from "@/services/api";
import { UserService } from "@/services/user.service";
import { LIMITS, MIN_PASSWORD } from "@/utils/validation";
import { useTranslation } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/Toast";

export default function ChangePasswordScreen() {
  const headerHeight = useFloatingHeaderHeight();
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"current" | "next" | "confirm", string>>>({});

  const submit = async () => {
    setError("");
    const errors: typeof fieldErrors = {};
    if (!current) errors.current = t.pwCurrentInvalid;
    if (next.length < MIN_PASSWORD) errors.next = t.passwordTooShort;
    else if (next === current) errors.next = t.pwSameAsCurrent;
    if (!errors.next && next !== confirm) errors.confirm = t.passwordsDontMatch;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      setLoading(true);
      // Un 400 (et non un 401) : l'app ne déconnecte pas l'utilisateur sur ce code.
      await UserService.changePassword(current, next);
      toast.success(t.pwChanged);
      router.back();
    } catch (err) {
      if (err instanceof ApiError && err.code === "CURRENT_PASSWORD_INVALID") {
        setFieldErrors({ current: t.pwCurrentInvalid });
      } else if (err instanceof ApiError && err.fieldErrors?.newPassword) {
        setFieldErrors({ next: err.fieldErrors.newPassword });
      } else {
        setError(err instanceof Error ? err.message : t.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScreenHeader floating title={t.pwChange} />
      <Screen topInset={false} tabBar={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: headerHeight }}>
        <FormField label={t.pwCurrent} error={fieldErrors.current}>
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
        <FormField label={t.pwNew} error={fieldErrors.next}>
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
        <FormField label={t.passwordAgain} error={fieldErrors.confirm}>
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
