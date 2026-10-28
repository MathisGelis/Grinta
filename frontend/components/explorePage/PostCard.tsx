import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { LOCALES } from "@/i18n/labels";
import { Post, PostsService } from "@/services/posts.service";
import PressableScale from "@/components/ui/PressableScale";
import Stat from "@/components/ui/Stat";

type Props = {
  post: Post;
  onPress?: () => void;
  onToggleLike?: () => void;
  onShowLikes?: () => void;
  onShowComments?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  authorPressable?: boolean;
};

const PAGE_HEIGHT = 176;

const details = new Map<string, Post>();

export default function PostCard({
  post,
  onPress,
  onToggleLike,
  onShowLikes,
  onShowComments,
  onDelete,
  deleting = false,
  authorPressable = true,
}: Props) {
  const { t, lang } = useTranslation();
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Post | undefined>(details.get(post.id));

  useEffect(() => {
    if (details.has(post.id)) return;
    let cancelled = false;
    PostsService.getPostById(post.id)
      .then((data) => {
        if (!data) return;
        details.set(post.id, data);
        if (!cancelled) setDetail(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const userId = detail?.userId ?? post.userId;
  const title = detail?.workoutTitle ?? detail?.workout?.title ?? t.completedWorkoutTitle;
  const description = detail?.workoutDescription ?? detail?.workout?.description;
  const duration = detail?.workoutDurationSeconds;
  const totalExercises = detail?.workout?.totalExercises;

  return (
    <View className="w-full gap-3 rounded-card bg-surface p-4">
      <PressableScale
        className="flex-row items-center gap-3 py-2"
        halo={false}
        disabled={!userId || !authorPressable}
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: "/(tabs)/explore/user-profile",
            params: { userId },
          } as any)
        }
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-tint">
          <Text className="text-sm font-bold text-ink">
            {post.displayName?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
            {post.displayName}
          </Text>
          <Text className="mt-0.5 text-[12px] text-ink-muted">
            {new Date(post.createdAt).toLocaleDateString(LOCALES[lang])}
          </Text>
        </View>
        {onDelete ? (
          <PressableScale
            onPress={onDelete}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel={t.deletePostTitle}
            className={`h-10 w-10 items-center justify-center rounded-full bg-danger-tint ${deleting ? "opacity-50" : ""}`}
          >
            <Ionicons name="trash-outline" size={18} color={WorkoutTheme.status.danger} />
          </PressableScale>
        ) : null}
      </PressableScale>

      <View onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
        {pageWidth > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth))
            }
          >
            <PressableScale
              halo={false}
              onPress={onPress}
              className="items-center justify-center gap-2 rounded-tile bg-accent-tint px-4"
              style={{ width: pageWidth, height: PAGE_HEIGHT }}
            >
              <Ionicons name="barbell" size={40} color={WorkoutTheme.accent.purple} />
              <Text className="text-center text-lg font-semibold text-ink" numberOfLines={2}>
                {title}
              </Text>
            </PressableScale>

            <PressableScale
              halo={false}
              onPress={onPress}
              className="justify-center gap-2 rounded-tile bg-raised p-5"
              style={{ width: pageWidth, height: PAGE_HEIGHT }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="list" size={20} color={WorkoutTheme.text.tertiary} />
                <Text className="text-xs text-ink-muted">{t.exercises}</Text>
              </View>
              <Text className="text-base text-ink" numberOfLines={5}>
                {totalExercises != null ? `${totalExercises}` : description || "–"}
              </Text>
            </PressableScale>

            <PressableScale
              halo={false}
              onPress={onPress}
              className="flex-row items-center rounded-tile bg-raised p-5"
              style={{ width: pageWidth, height: PAGE_HEIGHT }}
            >
              <Stat
                size="md"
                label={t.duration}
                value={duration != null ? `${Math.round(duration / 60)} min` : "–"}
                className="flex-1"
              />
              <Stat
                size="md"
                label={t.completedLabel}
                value={
                  detail?.workoutCompletionDate
                    ? new Date(detail.workoutCompletionDate).toLocaleDateString(LOCALES[lang], {
                        day: "numeric",
                        month: "short",
                      })
                    : "–"
                }
                className="flex-1"
              />
            </PressableScale>
          </ScrollView>
        )}
      </View>

      <View className="flex-row justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className={`h-1.5 rounded-full ${i === page ? "w-4 bg-accent" : "w-1.5 bg-raised"}`}
          />
        ))}
      </View>

      <View className="flex-row items-center justify-evenly">
        <PressableScale
          className="flex-row items-center gap-1 px-6 py-1"
          disabled={!onToggleLike && !onShowLikes}
          onPress={onToggleLike ?? onShowLikes}
          onLongPress={onShowLikes}
          delayLongPress={300}
        >
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={20}
            color={WorkoutTheme.status.danger}
          />
          <Text className="text-[16px] text-ink">{post.likesCount}</Text>
        </PressableScale>
        <PressableScale
          className="flex-row items-center gap-1 px-6 py-1"
          disabled={!onShowComments}
          onPress={onShowComments}
        >
          <Ionicons name="chatbubble-outline" size={20} color={WorkoutTheme.accent.purple} />
          <Text className="text-[16px] text-ink">{post.commentsCount}</Text>
        </PressableScale>
      </View>
    </View>
  );
}
