import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UserService, CurrentUser } from "@/services/user.service";
import { saveItem } from "@/core/services/storage";
import { PhotoService, pickImage } from "@/services/photo.service";
import { LIMITS, isValidUniqueName, sanitizeUniqueName } from "@/utils/validation";
import Avatar from "@/components/ui/Avatar";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
export default function EditProfileScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uniqueName, setUniqueName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    UserService.getMe()
      .then((me) => {
        setUser(me);
        setDisplayName(me.displayName);
        setUniqueName(me.uniqueName);
        setEmail(me.email);
        setAvatarUrl(me.avatarUrl ?? null);
      })
      .catch(() => Alert.alert(t.error, t.cannotLoadProfile))
      .finally(() => setLoading(false));
  }, [t]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert(t.error, t.nameEmptyError);
      return;
    }
    if (!user) return;
    // Un ancien pseudo non conforme reste valable tant qu'il n'est pas modifié.
    const uniqueNameChanged = uniqueName.trim() !== user.uniqueName;
    if (uniqueNameChanged && !isValidUniqueName(uniqueName)) {
      Alert.alert(t.error, uniqueName.trim().length < LIMITS.uniqueNameMin ? t.usernameTooShort : t.usernameInvalid);
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (displayName.trim() !== user.displayName) updates.displayName = displayName.trim();
      if (uniqueName.trim() !== user.uniqueName) updates.uniqueName = uniqueName.trim().toLowerCase();
      if (email.trim() !== user.email) updates.email = email.trim().toLowerCase();

      if (Object.keys(updates).length === 0) {
        router.back();
        return;
      }

      await UserService.updateProfile(user.id, updates);
      await saveItem("user_name", displayName.trim());
      Alert.alert(t.success, t.profileUpdatedMsg, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.cannotSaveProfile);
    } finally {
      setSaving(false);
    }
  };

  const changePhoto = async () => {
    try {
      const uri = await pickImage([1, 1]);
      if (!uri) return;
      setPhotoBusy(true);
      const result = await PhotoService.uploadAvatar(uri);
      setAvatarUrl(result.avatarUrl);
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.cannotUploadPhoto);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    try {
      setPhotoBusy(true);
      await PhotoService.removeAvatar();
      setAvatarUrl(null);
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.cannotUploadPhoto);
    } finally {
      setPhotoBusy(false);
    }
  };

  const uniqueNameError =
    !!user &&
    uniqueName.trim() !== user.uniqueName &&
    uniqueName.trim().length > 0 &&
    !isValidUniqueName(uniqueName);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <ScreenHeader title={t.editProfile} />

        <View className="items-center mb-10 gap-4">
          <PressableScale
            onPress={photoBusy ? undefined : changePhoto}
            accessibilityRole="button"
            accessibilityLabel={t.changePhoto}
          >
            <View className="rounded-full bg-accent p-[3px]">
              <Avatar uri={avatarUrl} name={displayName} size={96} />
              {photoBusy ? (
                <View className="absolute inset-[3px] items-center justify-center rounded-full bg-overlay">
                  <ActivityIndicator color={WorkoutTheme.text.primary} />
                </View>
              ) : null}
            </View>
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-accent">
              <Ionicons name="camera" size={16} color={WorkoutTheme.text.primary} />
            </View>
          </PressableScale>
          <View className="flex-row gap-2">
            <PressableScale
              onPress={photoBusy ? undefined : changePhoto}
              accessibilityRole="button"
              className="h-10 justify-center rounded-full bg-raised px-5"
            >
              <Text className="text-sm font-medium text-ink">{t.changePhoto}</Text>
            </PressableScale>
            {avatarUrl ? (
              <PressableScale
                onPress={photoBusy ? undefined : removePhoto}
                accessibilityRole="button"
                className="h-10 justify-center rounded-full bg-danger-tint px-5"
              >
                <Text className="text-sm font-medium text-danger">{t.removePhoto}</Text>
              </PressableScale>
            ) : null}
          </View>
        </View>

        <View className="px-6">
          <View className="mb-7">
            <Text className="text-accent-light text-xs mb-2.5">{t.name}</Text>
            <TextInput
              className="text-ink text-base py-1.5"
              value={displayName}
              maxLength={LIMITS.displayName}
              onChangeText={setDisplayName}
              placeholder={t.yourName}
              placeholderTextColor={WorkoutTheme.text.disabled}
            />
            <View className="h-[1px] bg-raised mt-1.5" />
          </View>

          <View className="mb-7">
            <Text className="text-accent-light text-xs mb-2.5">{t.usernameLabel}</Text>
            <View className="flex-row items-center">
              <Text className="text-accent-light text-base font-bold mr-1">@</Text>
              <TextInput
                className="text-ink text-base py-1.5 flex-1"
                value={uniqueName}
                maxLength={LIMITS.uniqueName}
                onChangeText={(text) => setUniqueName(sanitizeUniqueName(text))}
                placeholder={t.usernamePlaceholder}
                placeholderTextColor={WorkoutTheme.text.disabled}
                autoCapitalize="none"
              />
            </View>
            <View className="h-[1px] bg-raised mt-1.5" />
            <Text className={`text-[11px] mt-1.5 ${uniqueNameError ? "text-danger" : "text-ink-faint"}`}>
              {uniqueNameError ? t.usernameInvalid : t.usernameHint}
            </Text>
          </View>

          <View className="mb-7">
            <Text className="text-accent-light text-xs mb-2.5">{t.email}</Text>
            <TextInput
              className="text-ink text-base py-1.5"
              value={email}
              maxLength={LIMITS.email}
              onChangeText={setEmail}
              placeholder={t.emailPlaceholder}
              placeholderTextColor={WorkoutTheme.text.disabled}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View className="h-[1px] bg-raised mt-1.5" />
          </View>
        </View>

        <PressableScale
          className="mx-6 mt-4 h-[54px] bg-accent rounded-full items-center justify-center"
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-ink text-base font-bold">{saving ? t.saving : t.save}</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}
