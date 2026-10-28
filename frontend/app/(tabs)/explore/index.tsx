import { getItem, saveItem } from "@/core/services/storage";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, StatusBar, Text, View } from "react-native";
import { UserService } from "@/services/user.service";
import { Post, PostsService } from "@/services/posts.service";

import { WorkoutTheme } from "@/constants/Colors";
import Screen, { FLOATING_HEADER_OFFSET } from "@/components/ui/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PostCard from "@/components/explorePage/PostCard";
import { usePostInteractions } from "@/components/explorePage/PostInteractions";
import SectionHeader from "@/components/ui/SectionHeader";
import SegmentedControl from "@/components/ui/SegmentedControl";
function getGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const { openLikes, openComments, modals } = usePostInteractions(userId);

  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [postFeed, setPostFeed] = useState<"top" | "followed">("top");

  const handleToggleLike = useCallback(async (post: Post) => {
    setTopPosts((prev) =>
      prev.map((item) => {
        if (item.id !== post.id) return item;

        const nextLiked = !item.isLiked;
        const currentLikes = Number(item.likesCount ?? 0);

        return {
          ...item,
          isLiked: nextLiked,
          likesCount: String(Math.max(0, currentLikes + (nextLiked ? 1 : -1))),
        };
      }),
    );

    try {
      await PostsService.likePost(post.id);
    } catch {
      setTopPosts((prev) =>
        prev.map((item) => {
          if (item.id !== post.id) return item;
          const currentLikes = Number(item.likesCount ?? 0);
          const revertedLiked = !item.isLiked;

          return {
            ...item,
            isLiked: revertedLiked,
            likesCount: String(
              Math.max(0, currentLikes + (revertedLiked ? 1 : -1)),
            ),
          };
        }),
      );
    }
  }, []);

  useEffect(() => {
    getItem("user_name").then((name) => {
      if (name) setUserName(name);
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await UserService.getMe();
      setUserId(me.id);
      if (me.displayName) {
        setUserName(me.displayName);
        saveItem("user_name", me.displayName);
      }

      const postsData =
        postFeed === "top"
          ? await PostsService.getTopPosts(5)
          : await PostsService.getFollowedPosts(5);
      setTopPosts(postsData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [postFeed]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      <Screen
        topInset={false}
        contentContainerStyle={{ paddingTop: insets.top + FLOATING_HEADER_OFFSET }}
      >
        <View>
          <Text className="text-sm text-ink-muted">{t[getGreetingKey()]}</Text>
          <Text
            className="mt-1 text-[32px] font-semibold text-ink"
            style={{ letterSpacing: -0.5 }}
            numberOfLines={1}
          >
            {t.hello}
            {userName ? ` ${userName}` : ""}
          </Text>
        </View>

        <View className="gap-4">
          <SectionHeader title={t.todaysCommunityFavorite} />
          <SegmentedControl
            value={postFeed}
            onChange={setPostFeed}
            options={[
              { value: "top", label: t.topPostsTab },
              { value: "followed", label: t.followedPeopleTab },
            ]}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={WorkoutTheme.accent.purple}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {topPosts.length > 0 ? (
              <View className="gap-3">
                {topPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/explore/userPost",
                        params: {
                          postId: post.id,
                          post: JSON.stringify(post),
                        },
                      } as any)
                    }
                    onToggleLike={() => handleToggleLike(post)}
                    onShowLikes={() => openLikes(post.id)}
                    onShowComments={() => openComments(post.id)}
                  />
                ))}
              </View>
            ) : (
              <View className="min-h-[330px] items-center justify-center rounded-card bg-surface p-8">
                <Text className="text-center text-base font-semibold text-ink-muted">
                  {t.noPopularPosts}
                </Text>
              </View>
            )}
          </>
        )}
      </Screen>

      {modals}
    </View>
  );
}
