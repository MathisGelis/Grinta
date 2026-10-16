import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { TokenService } from "@/services/token.service";
import { UserService, CurrentUser, UserProfile } from "@/services/user.service";
import { StatsService } from "@/services/stats.service";
import { useTranslation } from "@/contexts/LanguageContext";

import { WorkoutTheme } from "@/constants/Colors";
import Screen from "@/components/ui/Screen";
import Stat from "@/components/ui/Stat";
import Button from "@/components/ui/Button";
import PressableScale from "@/components/ui/PressableScale";
function formatJoinDate(dateStr: string, months: string[]): string {
  const d = new Date(dateStr);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const MENU_ITEMS = [
    {
      id: "edit",
      label: t.editProfile,
      icon: "person-outline" as const,
      route: "/(tabs)/profile/edit-profile",
    },
    {
      id: "privacy",
      label: t.privacyPolicy,
      icon: "shield-checkmark-outline" as const,
      route: "/(tabs)/profile/privacy-policy",
    },
    {
      id: "settings",
      label: t.settings,
      icon: "settings-outline" as const,
      route: "/(tabs)/profile/settings",
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await UserService.getMe();
      setUser(me);

      const [profileData] = await Promise.all([
        UserService.getProfile(me.id),
        StatsService.getSummary("month").catch(() => null),
      ]);
      setProfile(profileData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSignOut = () => {
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

  const userName = user?.displayName ?? t.athlete;
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = user?.createdAt ? formatJoinDate(user.createdAt, t.months) : "";
  const workoutsCount = profile?.workoutsCount ?? 0;
  const followersCount = profile?.followersCount ?? 0;
  const followingCount = profile?.followingCount ?? 0;

  return (
    <Screen>
      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : (
        <>
          <View className="items-center gap-1">
            <View className="mb-2 h-24 w-24 items-center justify-center rounded-full bg-accent">
              <Text className="text-3xl font-semibold text-ink">{initials}</Text>
            </View>
            <Text className="text-xl font-semibold text-ink">{userName}</Text>
            {user?.uniqueName ? (
              <Text className="text-sm font-medium text-accent">@{user.uniqueName}</Text>
            ) : null}
            {joinedDate ? (
              <Text className="text-xs text-ink-muted">
                {t.joined} {joinedDate}
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            <PressableScale
              className="flex-1 items-center rounded-tile bg-surface p-4"
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/profile/followers",
                  params: { userId: user?.id, tab: "followers" },
                } as any)
              }
            >
              <Stat value={followersCount} label={t.followersLabel} className="items-center" />
            </PressableScale>
            <PressableScale
              className="flex-1 items-center rounded-tile bg-surface p-4"
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/profile/followers",
                  params: { userId: user?.id, tab: "following" },
                } as any)
              }
            >
              <Stat value={followingCount} label={t.followingLabel} className="items-center" />
            </PressableScale>
            <View className="flex-1 items-center rounded-tile bg-surface p-4">
              <Stat value={workoutsCount} label={t.workoutsLabel} className="items-center" />
            </View>
          </View>

          <PressableScale
            accessibilityRole="button"
            className="flex-row items-center justify-between rounded-card border border-warning/30 bg-surface p-5"
          >
            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-ink">{t.upgradeToPro}</Text>
              <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
                {t.unlockAll}
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-warning/15">
              <MaterialCommunityIcons
                name="crown"
                size={20}
                color={WorkoutTheme.status.warning}
              />
            </View>
          </PressableScale>

          <View className="gap-3">
            {MENU_ITEMS.map((item) => (
              <PressableScale
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                className="flex-row items-center gap-3 rounded-full bg-surface p-2 pr-5"
                onPress={() => item.route && router.push(item.route as any)}
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-accent-tint">
                  <Ionicons name={item.icon} size={20} color={WorkoutTheme.accent.purple} />
                </View>
                <Text className="flex-1 text-base font-medium text-ink">{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={WorkoutTheme.text.tertiary} />
              </PressableScale>
            ))}
          </View>

          <Button
            variant="danger"
            icon="log-out-outline"
            label={t.signOut}
            onPress={handleSignOut}
          />
        </>
      )}
    </Screen>
  );
}
