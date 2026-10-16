import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UserService, CurrentUser } from "@/services/user.service";
import { saveItem } from "@/core/services/storage";

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

  useEffect(() => {
    UserService.getMe()
      .then((me) => {
        setUser(me);
        setDisplayName(me.displayName);
        setUniqueName(me.uniqueName);
        setEmail(me.email);
      })
      .catch(() => Alert.alert(t.error, t.cannotLoadProfile))
      .finally(() => setLoading(false));
  }, [t]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert(t.error, t.nameEmptyError);
      return;
    }
    if (!uniqueName.trim() || uniqueName.trim().length < 3) {
      Alert.alert(t.error, t.usernameTooShort);
      return;
    }
    if (!user) return;

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

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

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

        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-[48px] p-[3px] bg-accent">
            <View className="flex-1 rounded-[48px] bg-accent-tint items-center justify-center">
              <Text className="text-ink text-[28px] font-bold">{initials}</Text>
            </View>
          </View>
          <View className="w-8 h-8 rounded-full bg-accent items-center justify-center -mt-4">
            <Ionicons name="camera" size={16} color={WorkoutTheme.text.primary} />
          </View>
        </View>

        <View className="px-6">
          <View className="mb-7">
            <Text className="text-accent text-xs mb-2.5">{t.name}</Text>
            <TextInput
              className="text-ink text-base py-1.5"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t.yourName}
              placeholderTextColor={WorkoutTheme.text.disabled}
            />
            <View className="h-[1px] bg-raised mt-1.5" />
          </View>

          <View className="mb-7">
            <Text className="text-accent text-xs mb-2.5">{t.usernameLabel}</Text>
            <View className="flex-row items-center">
              <Text className="text-accent text-base font-bold mr-1">@</Text>
              <TextInput
                className="text-ink text-base py-1.5 flex-1"
                value={uniqueName}
                onChangeText={(text) => setUniqueName(text.replace(/[^a-zA-Z0-9_]/g, ""))}
                placeholder={t.usernamePlaceholder}
                placeholderTextColor={WorkoutTheme.text.disabled}
                autoCapitalize="none"
              />
            </View>
            <View className="h-[1px] bg-raised mt-1.5" />
            <Text className="text-ink-faint text-[11px] mt-1.5">{t.usernameHint}</Text>
          </View>

          <View className="mb-7">
            <Text className="text-accent text-xs mb-2.5">{t.email}</Text>
            <TextInput
              className="text-ink text-base py-1.5"
              value={email}
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
