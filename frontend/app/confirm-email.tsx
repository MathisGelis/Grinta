import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenBackground from "@/components/ui/ScreenBackground";
import Screen from "@/components/ui/Screen";
import Button from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/skeletons";
import { ApiError } from "@/services/api";
import { AuthService } from "@/services/auth.service";
import { clearUserSession } from "@/services/session.service";
import { useTranslation } from "@/contexts/LanguageContext";

/** Lien `grinta://confirm-email?token=…` : confirme la nouvelle adresse, puis redemande une connexion. */
export default function ConfirmEmailScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [state, setState] = useState<"loading" | "done" | "invalid">(token ? "loading" : "invalid");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    AuthService.confirmEmail(String(token))
      .then(async () => {
        // Les anciennes sessions sont coupées par le serveur : on repart d'une session propre.
        await clearUserSession();
        if (!cancelled) setState("done");
      })
      .catch((err) => {
        if (cancelled) return;
        setMessage(err instanceof ApiError ? err.message : t.resetTokenInvalid);
        setState("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  return (
    <View className="flex-1">
      <ScreenBackground />
      <Screen tabBar={false}>
        <Text className="text-[28px] font-semibold text-ink">{t.confirmEmailTitle}</Text>
        {state === "loading" ? (
          <ListSkeleton count={2} />
        ) : state === "done" ? (
          <>
            <Text className="text-sm text-ink-soft">{t.confirmEmailDone}</Text>
            <Button label={t.login} onPress={() => router.replace("/(auth)/LoginScreen")} />
          </>
        ) : (
          <>
            <Text className="text-sm text-danger">{message || t.resetTokenInvalid}</Text>
            <Button label={t.login} onPress={() => router.replace("/(auth)/LoginScreen")} />
          </>
        )}
      </Screen>
    </View>
  );
}
