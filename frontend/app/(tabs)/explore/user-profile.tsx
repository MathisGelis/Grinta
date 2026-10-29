import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { UserService, UserProfile } from "@/services/user.service";
import { ConnectionsService } from "@/services/connections.service";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
export default function UserProfileScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followStatus, setFollowStatus] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!params.userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await UserService.getProfile(params.userId);
      setProfile(data);
      setFollowStatus(data.followStatus);
    } catch {
      Alert.alert(t.error, t.cannotLoadProfile);
    } finally {
      setLoading(false);
    }
  }, [t, params.userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!params.userId) return;
    setActionLoading(true);
    try {
      const result = await ConnectionsService.follow(params.userId);
      setFollowStatus(result.status === "FOLLOWING" ? "FOLLOWING" : "REQUEST_SENT");
      if (result.status === "FOLLOWING" && profile) {
        setProfile({ ...profile, followersCount: profile.followersCount + 1 });
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!params.userId) return;
    setActionLoading(true);
    try {
      await ConnectionsService.unfollow(params.userId);
      setFollowStatus("FOLLOW");
      if (profile) {
        setProfile({ ...profile, followersCount: Math.max(0, profile.followersCount - 1) });
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderFollowButton = () => {
    if (followStatus === "SELF") return null;
    if (followStatus === "FOLLOWING") {
      return (
        <PressableScale className="bg-transparent px-8 py-2.5 rounded-tile border border-line" onPress={handleUnfollow} disabled={actionLoading}>
          <Text className="text-ink-muted text-sm font-semibold">{actionLoading ? "..." : t.followingStatus}</Text>
        </PressableScale>
      );
    }
    if (followStatus === "REQUEST_SENT") {
      return (
        <View className="bg-transparent px-8 py-2.5 rounded-tile border border-line">
          <Text className="text-ink-faint text-sm font-semibold">{t.requestSent}</Text>
        </View>
      );
    }
    return (
      <PressableScale className="bg-accent px-8 py-2.5 rounded-full" onPress={handleFollow} disabled={actionLoading}>
        <Text className="text-ink text-sm font-semibold">
          {actionLoading ? "..." : followStatus === "FOLLOW_BACK" ? t.followBackAction : t.followAction}
        </Text>
      </PressableScale>
    );
  };

  return (
    <View className="flex-1">
      <ScreenBackground />
      <View className="flex-row items-center px-4 pt-16 pb-4 justify-between">
        <PressableScale onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <Text className="text-ink text-lg font-bold flex-1 text-center" numberOfLines={1}>
          {profile?.uniqueName ? `@${profile.uniqueName}` : "Profil"}
        </Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} style={{ marginTop: 60 }} />
      ) : profile ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="items-center py-5">
            <View className="mb-3 rounded-full bg-accent p-[3px]">
              <Avatar uri={profile.avatarUrl} name={profile.displayName} size={88} />
            </View>
            <Text className="text-ink text-xl font-bold mb-0.5">{profile.displayName}</Text>
            <Text className="text-accent text-sm font-medium">@{profile.uniqueName}</Text>
          </View>

          <View className="items-center mb-5">
            {renderFollowButton()}
          </View>

          <View className="flex-row bg-surface rounded-card mx-5 p-5 mb-4">
            <PressableScale
              className="flex-1 items-center"
              onPress={() => router.push({ pathname: "/(tabs)/profile/followers", params: { userId: params.userId, tab: "followers" } } as any)}
            >
              <Text className="text-ink text-lg font-bold mb-1">{profile.followersCount}</Text>
              <Text className="text-ink-muted text-xs">{t.followersLabel}</Text>
            </PressableScale>
            <View className="w-[1px] bg-raised" />
            <PressableScale
              className="flex-1 items-center"
              onPress={() => router.push({ pathname: "/(tabs)/profile/followers", params: { userId: params.userId, tab: "following" } } as any)}
            >
              <Text className="text-ink text-lg font-bold mb-1">{profile.followingCount}</Text>
              <Text className="text-ink-muted text-xs">{t.followingLabel}</Text>
            </PressableScale>
            <View className="w-[1px] bg-raised" />
            <View className="flex-1 items-center">
              <Text className="text-ink text-lg font-bold mb-1">{profile.workoutsCount}</Text>
              <Text className="text-ink-muted text-xs">{t.workoutsLabel}</Text>
            </View>
          </View>

          {profile.isPrivate && (
            <View className="flex-row items-center justify-center bg-surface rounded-tile mx-4 p-5 gap-2">
              <Ionicons name="lock-closed" size={20} color={WorkoutTheme.text.tertiary} />
              <Text className="text-ink-muted text-sm">{t.privateProfile}</Text>
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}
