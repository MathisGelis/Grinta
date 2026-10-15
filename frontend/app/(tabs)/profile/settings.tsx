import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/contexts/LanguageContext";
import { clearAll } from "@/core/services/storage";
import { TokenService } from "@/services/token.service";
import { UserService } from "@/services/user.service";

import Button from "@/components/ui/Button";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);

  const items = [
    {
      label: t.unitsOfMeasure,
      icon: "scale-outline" as const,
      route: "/(tabs)/profile/settings-units",
    },
    {
      label: t.notificationsSettings,
      icon: "notifications-outline" as const,
      route: "/(tabs)/profile/settings-notifications",
    },
    {
      label: t.language,
      icon: "language-outline" as const,
      route: "/(tabs)/profile/settings-language",
    },
    {
      label: t.contactUs,
      icon: "mail-outline" as const,
      route: "/(tabs)/profile/settings-contact",
    },
  ];

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      await UserService.deleteAccount();
      await TokenService.remove();
      await clearAll();
      router.replace("/(auth)/LandingScreen");
    } catch (error) {
      Alert.alert(
        t.error,
        error instanceof Error ? error.message : t.error,
      );
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(t.deleteAccount, t.deleteAccountMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.deleteAccount,
        style: "destructive",
        onPress: () =>
          Alert.alert(t.deleteAccount, t.deleteAccountFinal, [
            { text: t.cancel, style: "cancel" },
            {
              text: t.deleteAccount,
              style: "destructive",
              onPress: deleteAccount,
            },
          ]),
      },
    ]);
  };

  return (
    <View className="flex-1">
      <ScreenHeader title={t.settings} />

      <View className="mx-5 bg-surface rounded-card overflow-hidden">
        {items.map((item, i) => (
          <PressableScale
            key={i}
            className={`flex-row items-center px-5 py-[18px] gap-3.5 ${i < items.length - 1 ? "" : ""}`}
            onPress={() => router.push(item.route as any)}
          >
            <View className="w-9 h-9 rounded-full bg-accent-tint items-center justify-center">
              <Ionicons name={item.icon} size={20} color={WorkoutTheme.accent.purple} />
            </View>
            <Text className="flex-1 text-ink text-[15px] font-medium">{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={WorkoutTheme.text.disabled} />
          </PressableScale>
        ))}
      </View>

      <View className="mt-auto px-5" style={{ marginBottom: insets.bottom + 112 }}>
        <Button
          variant="danger"
          label={t.deleteAccount}
          icon="trash-outline"
          loading={deleting}
          onPress={confirmDelete}
        />
      </View>
    </View>
  );
}
