import React, { useEffect, useRef, useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, FlatList } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { isNotFound } from "@/services/api";
import { ConnectionsService, FOLLOW_PAGE_SIZE, UserListItem } from "@/services/connections.service";

import EmptyState from "@/components/ui/EmptyState";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import { WorkoutTheme } from "@/constants/Colors";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
import { UserListSkeleton } from "@/components/ui/skeletons";
type FollowersViewProps = {
  /** Où ouvrir un profil depuis la liste : reste dans la pile de l'onglet d'origine. */
  userProfilePath: string;
};

export function FollowersView({ userProfilePath }: FollowersViewProps) {
  const headerHeight = useFloatingHeaderHeight();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ userId: string; tab: string }>();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    (params.tab as any) || "followers"
  );
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<UserListItem[]>([]);
  const [following, setFollowing] = useState<UserListItem[]>([]);
  // Liste inaccessible (compte privé que l'on ne suit pas) : le serveur répond 404.
  const [restricted, setRestricted] = useState(false);
  const [hasMore, setHasMore] = useState({ followers: false, following: false });
  const loadingMore = useRef(false);

  useEffect(() => {
    if (!params.userId) return;
    setLoading(true);
    setRestricted(false);
    const load = (fetcher: (id: string, offset?: number) => Promise<UserListItem[]>) =>
      fetcher(params.userId, 0).catch((err) => {
        if (isNotFound(err)) setRestricted(true);
        return [] as UserListItem[];
      });
    Promise.all([
      load(ConnectionsService.getFollowers),
      load(ConnectionsService.getFollowing),
    ])
      .then(([f, g]) => {
        setFollowers(f);
        setFollowing(g);
        setHasMore({
          followers: f.length === FOLLOW_PAGE_SIZE,
          following: g.length === FOLLOW_PAGE_SIZE,
        });
      })
      .finally(() => setLoading(false));
  }, [params.userId]);

  const list = activeTab === "followers" ? followers : following;

  // Pages suivantes (le serveur renvoie 100 comptes au plus par requête).
  const loadMore = async () => {
    if (loadingMore.current || loading || !hasMore[activeTab] || !params.userId) return;
    loadingMore.current = true;
    const tab = activeTab;
    try {
      const fetcher = tab === "followers" ? ConnectionsService.getFollowers : ConnectionsService.getFollowing;
      const page = await fetcher(params.userId, list.length);
      (tab === "followers" ? setFollowers : setFollowing)((prev) => [...prev, ...page]);
      setHasMore((prev) => ({ ...prev, [tab]: page.length === FOLLOW_PAGE_SIZE }));
    } catch {
    } finally {
      loadingMore.current = false;
    }
  };

  // Liste inaccessible : pas de compteur « (0) » trompeur.
  const countLabel = (count: number, more: boolean) =>
    restricted ? "" : ` (${more ? `${count}+` : count})`;

  return (
    <View className="flex-1">
      <ScreenHeader floating title={activeTab === "followers" ? t.followersLabel : t.followingLabel} />

      <FlatList {...chromeScrollProps}
        data={loading ? [] : list}
        keyExtractor={(u) => u.id}
        showsVerticalScrollIndicator={false}
        initialNumToRender={14}
        maxToRenderPerBatch={14}
        windowSize={7}
        removeClippedSubviews
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingTop: headerHeight, paddingHorizontal: 16, paddingBottom: 120 }}
        ListHeaderComponent={
        <View className="flex-row mb-4 gap-2">
            <PressableScale
              className={`flex-1 py-2.5 rounded-full items-center ${activeTab === "followers" ? "bg-accent" : "bg-surface"}`}
              onPress={() => setActiveTab("followers")}
            >
              <Text className={`text-[13px] font-semibold ${activeTab === "followers" ? "text-ink" : "text-ink-muted"}`}>
                {t.followersLabel}{countLabel(followers.length, hasMore.followers)}
              </Text>
            </PressableScale>
            <PressableScale
              className={`flex-1 py-2.5 rounded-full items-center ${activeTab === "following" ? "bg-accent" : "bg-surface"}`}
              onPress={() => setActiveTab("following")}
            >
              <Text className={`text-[13px] font-semibold ${activeTab === "following" ? "text-ink" : "text-ink-muted"}`}>
                {t.followingLabel}{countLabel(following.length, hasMore.following)}
              </Text>
            </PressableScale>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <UserListSkeleton count={6} />
          ) : (
            <EmptyState
              icon={restricted ? "lock-closed-outline" : "person-outline"}
              title={restricted ? t.privateProfile : activeTab === "followers" ? t.noFollowers : t.noFollowing}
              className="mt-4"
            />
          )
        }
        renderItem={({ item: u }) => (
          <PressableScale
            className="flex-row items-center bg-surface rounded-tile p-3 mb-2 gap-2.5"
            onPress={() => router.push({ pathname: userProfilePath, params: { userId: u.id } } as any)}
          >
            <Avatar uri={u.avatarThumbnailUrl} name={u.displayName} size={40} />
            <View className="flex-1">
              <Text className="text-ink text-sm font-semibold">{u.displayName}</Text>
              <Text className="text-ink-muted text-xs mt-[1px]">@{u.uniqueName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={WorkoutTheme.text.disabled} />
          </PressableScale>
        )}
      />
    </View>
  );
}

export default function FollowersScreen() {
  return <FollowersView userProfilePath="/(tabs)/profile/user-profile" />;
}
