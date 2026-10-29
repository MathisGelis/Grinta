import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ConnectionsService, UserListItem } from "@/services/connections.service";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { WorkoutTheme } from "@/constants/Colors";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
export default function FollowersScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ userId: string; tab: string }>();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    (params.tab as any) || "followers"
  );
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<UserListItem[]>([]);
  const [following, setFollowing] = useState<UserListItem[]>([]);

  useEffect(() => {
    if (!params.userId) return;
    setLoading(true);
    Promise.all([
      ConnectionsService.getFollowers(params.userId).catch(() => []),
      ConnectionsService.getFollowing(params.userId).catch(() => []),
    ])
      .then(([f, g]) => {
        setFollowers(f);
        setFollowing(g);
      })
      .finally(() => setLoading(false));
  }, [params.userId]);

  const list = activeTab === "followers" ? followers : following;

  return (
    <View className="flex-1">
      <ScreenHeader title={activeTab === "followers" ? t.followersLabel : t.followingLabel} />

      <View className="flex-row mx-4 mb-4 gap-2">
        <PressableScale
          className={`flex-1 py-2.5 rounded-full items-center ${activeTab === "followers" ? "bg-accent" : "bg-surface"}`}
          onPress={() => setActiveTab("followers")}
        >
          <Text className={`text-[13px] font-semibold ${activeTab === "followers" ? "text-ink" : "text-ink-muted"}`}>
            {t.followersLabel} ({followers.length})
          </Text>
        </PressableScale>
        <PressableScale
          className={`flex-1 py-2.5 rounded-full items-center ${activeTab === "following" ? "bg-accent" : "bg-surface"}`}
          onPress={() => setActiveTab("following")}
        >
          <Text className={`text-[13px] font-semibold ${activeTab === "following" ? "text-ink" : "text-ink-muted"}`}>
            {t.followingLabel} ({following.length})
          </Text>
        </PressableScale>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={WorkoutTheme.accent.purple} style={{ marginTop: 32 }} />
        ) : list.length === 0 ? (
          <View className="items-center mt-12 gap-2.5">
            <Ionicons name="person-outline" size={36} color={WorkoutTheme.text.disabled} />
            <Text className="text-ink-faint text-sm">
              {activeTab === "followers" ? t.noFollowers : t.noFollowing}
            </Text>
          </View>
        ) : (
          list.map((u) => (
            <PressableScale
              key={u.id}
              className="flex-row items-center bg-surface rounded-tile p-3 mb-2 gap-2.5"
              onPress={() => router.push({ pathname: "/(tabs)/profile/user-profile", params: { userId: u.id } } as any)}
            >
              <Avatar uri={u.avatarThumbnailUrl} name={u.displayName} size={40} />
              <View className="flex-1">
                <Text className="text-ink text-sm font-semibold">{u.displayName}</Text>
                <Text className="text-ink-muted text-xs mt-[1px]">@{u.uniqueName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={WorkoutTheme.text.disabled} />
            </PressableScale>
          ))
        )}
      </ScrollView>
    </View>
  );
}
