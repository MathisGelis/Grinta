import React, { useCallback, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { UserService, CurrentUser, UserProfile } from "@/services/user.service";
import { useTranslation } from "@/contexts/LanguageContext";
import { WorkoutTheme } from "@/constants/Colors";
import Screen from "@/components/ui/Screen";
import Avatar from "@/components/ui/Avatar";
import Stat from "@/components/ui/Stat";
import Glass from "@/components/ui/Glass";
import IconButton from "@/components/ui/IconButton";
import PressableScale from "@/components/ui/PressableScale";
import MyPostsSection from "@/components/profile/MyPostsSection";
import { usePostInteractions } from "@/components/explorePage/PostInteractions";
import GlobalStatsSection from "@/components/profile/GlobalStatsSection";
import SegmentedControl from "@/components/ui/SegmentedControl";

function formatJoinDate(dateStr: string, months: string[]): string {
  const d = new Date(dateStr);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ProfileScreen() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<"stats" | "posts">("stats");
  const { openLikes, openComments, modals } = usePostInteractions(
    user?.id ?? "",
    { userProfilePath: "/(tabs)/profile/user-profile" },
  );

  const fetchData = useCallback(async () => {
    try {
      const me = await UserService.getMe();
      setUser(me);
      setProfile(await UserService.getProfile(me.id));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handlePostDeleted = (postId: string) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            posts: (prev.posts ?? []).filter((p) => p.id !== postId),
            postsCount: Math.max(0, prev.postsCount - 1),
          }
        : prev,
    );
  };

  const userName = user?.displayName ?? t.athlete;
  const joinedDate = user?.createdAt
    ? formatJoinDate(user.createdAt, t.months)
    : "";
  const workoutsCount = profile?.workoutsCount ?? 0;
  const followersCount = profile?.followersCount ?? 0;
  const followingCount = profile?.followingCount ?? 0;

  return (
    <>
      <Screen>
        <View className="flex-row items-center justify-between">
          <PressableScale
            onPress={() => router.push("/(tabs)/profile/premium" as any)}
            accessibilityRole="button"
            accessibilityLabel={t.premiumTitle}
            style={{ width: 44, height: 44, borderRadius: 22 }}
          >
            <Glass
              className="items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 22 }}
            >
              <MaterialCommunityIcons
                name="crown"
                size={22}
                color={WorkoutTheme.status.warning}
              />
            </Glass>
          </PressableScale>

          <IconButton
            icon="settings-outline"
            variant="glass"
            label={t.settings}
            onPress={() => router.push("/(tabs)/profile/settings")}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
        ) : (
          <>
            <View className="-mt-4 items-center gap-1">
              <View className="mb-2 rounded-full bg-accent p-[3px]">
                <Avatar uri={user?.avatarUrl} name={userName} size={96} />
              </View>
              <Text className="text-xl font-semibold text-ink">{userName}</Text>
              {user?.uniqueName ? (
                <Text className="text-sm font-medium text-accent">
                  @{user.uniqueName}
                </Text>
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
                <Stat
                  value={followersCount}
                  label={t.followersLabel}
                  className="items-center"
                />
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
                <Stat
                  value={followingCount}
                  label={t.followingLabel}
                  className="items-center"
                />
              </PressableScale>
              <View className="flex-1 items-center rounded-tile bg-surface p-4">
                <Stat
                  value={workoutsCount}
                  label={t.workoutsLabel}
                  className="items-center"
                />
              </View>
            </View>

            <SegmentedControl
              id="profile-tab"
              options={[
                { value: "stats", label: t.profileTabStats },
                { value: "posts", label: t.profileTabPosts },
              ]}
              value={tab}
              onChange={setTab}
            />

            {tab === "stats" ? (
              <GlobalStatsSection />
            ) : (
              <MyPostsSection
                posts={profile?.posts ?? []}
                authorName={userName}
                authorId={user?.id}
                onDeleted={handlePostDeleted}
                onOpenPost={(post) =>
                  router.push({
                    pathname: "/(tabs)/profile/userPost",
                    params: { postId: post.id, post: JSON.stringify(post) },
                  } as any)
                }
                onShowLikes={openLikes}
                onShowComments={openComments}
              />
            )}
          </>
        )}
      </Screen>
      {modals}
    </>
  );
}
