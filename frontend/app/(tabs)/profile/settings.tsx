import React, { useCallback, useState } from "react";
import { Alert, Switch, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import { clearAll } from "@/core/services/storage";
import { TokenService } from "@/services/token.service";
import { UserService } from "@/services/user.service";
import { WorkoutTheme } from "@/constants/Colors";
import Screen from "@/components/ui/Screen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SettingsRow, { SettingsSection } from "@/components/profile/SettingsRow";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [savingVisibility, setSavingVisibility] = useState(false);

  useFocusEffect(
    useCallback(() => {
      UserService.getMe()
        .then((me) => setIsPublic(me.isPublic ?? true))
        .catch(() => {});
    }, []),
  );

  const toggleVisibility = async () => {
    if (isPublic === null || savingVisibility) return;
    const previous = isPublic;
    setIsPublic(!previous);
    setSavingVisibility(true);
    try {
      const result = await UserService.toggleVisibility();
      setIsPublic(result.isPublic);
    } catch {
      setIsPublic(previous);
      Alert.alert(t.error, t.cannotUpdateVisibility);
    } finally {
      setSavingVisibility(false);
    }
  };

  const signOut = () => {
    Alert.alert(t.signOutConfirmTitle, t.signOutConfirmMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.signOut,
        style: "destructive",
        onPress: async () => {
          await TokenService.remove();
          router.replace("/(auth)/LoginScreen");
        },
      },
    ]);
  };

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      await UserService.deleteAccount();
      await TokenService.remove();
      await clearAll();
      router.replace("/(auth)/LandingScreen");
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : t.error);
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

      <Screen topInset={false}>
        <SettingsSection title={t.settingsSectionAccount}>
          <SettingsRow
            icon="person-outline"
            label={t.editProfile}
            onPress={() => router.push("/(tabs)/profile/edit-profile")}
          />
          <SettingsRow
            icon={isPublic === false ? "lock-closed-outline" : "eye-outline"}
            label={t.profileVisibility}
            hint={isPublic === false ? t.visibilityPrivateHint : t.visibilityPublicHint}
            right={
              <Switch
                value={isPublic ?? true}
                disabled={isPublic === null || savingVisibility}
                onValueChange={toggleVisibility}
                trackColor={{
                  false: WorkoutTheme.backgroundTertiary,
                  true: WorkoutTheme.accent.purple,
                }}
                thumbColor={WorkoutTheme.text.primary}
                accessibilityLabel={t.profileVisibility}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title={t.settingsSectionPreferences}>
          <SettingsRow
            icon="scale-outline"
            label={t.unitsOfMeasure}
            onPress={() => router.push("/(tabs)/profile/settings-units")}
          />
          <SettingsRow
            icon="notifications-outline"
            label={t.notificationsSettings}
            onPress={() => router.push("/(tabs)/profile/settings-notifications")}
          />
          <SettingsRow
            icon="language-outline"
            label={t.language}
            onPress={() => router.push("/(tabs)/profile/settings-language")}
          />
        </SettingsSection>

        <SettingsSection title={t.settingsSectionSupport}>
          <SettingsRow
            icon="mail-outline"
            label={t.contactUs}
            onPress={() => router.push("/(tabs)/profile/settings-contact")}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t.privacyPolicy}
            onPress={() => router.push("/(tabs)/profile/privacy-policy")}
          />
        </SettingsSection>

        <SettingsSection title={t.settingsSectionSession}>
          <SettingsRow
            icon="log-out-outline"
            label={t.signOut}
            danger
            onPress={signOut}
          />
          <SettingsRow
            icon="trash-outline"
            label={t.deleteAccount}
            danger
            loading={deleting}
            onPress={confirmDelete}
          />
        </SettingsSection>
      </Screen>
    </View>
  );
}
