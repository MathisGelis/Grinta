import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { LOCALES } from "@/i18n/labels";
import { format } from "@/i18n/translations";
import { Post, PostsService } from "@/services/posts.service";
import { mediaUrl } from "@/services/api";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import Stat from "@/components/ui/Stat";
import MentionText from "@/components/explorePage/MentionText";
import PostPartners from "@/components/explorePage/PostPartners";

type Props = {
  post: Post;
  onPress?: () => void;
  onToggleLike?: () => void;
  onShowLikes?: () => void;
  onShowComments?: () => void;
  onDelete?: () => void;
  /** Bouton de partage, affiché sur nos propres posts. */
  onShare?: () => void;
  deleting?: boolean;
  authorPressable?: boolean;
};

const PAGE_GAP = 8;
const MAX_EXERCISES = 5;

const details = new Map<string, Post>();

export default function PostCard({
  post,
  onPress,
  onToggleLike,
  onShowLikes,
  onShowComments,
  onDelete,
  onShare,
  deleting = false,
  authorPressable = true,
}: Props) {
  const { t, lang } = useTranslation();
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Post | undefined>(details.get(post.id));
  const [declinedBy, setDeclinedBy] = useState<string | null>(null);

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
  const duration = post.stats?.durationSeconds ?? detail?.workoutDurationSeconds;
  const exercises = post.exercises ?? detail?.exercises;
  const stats = post.stats ?? detail?.stats;
  const totalExercises = detail?.workout?.totalExercises;
  const photo = mediaUrl(detail?.workoutPhotoThumbnailUrl ?? post.workoutPhotoThumbnailUrl);
  const partners = (detail?.partners ?? post.partners)?.filter((p) => p.id !== declinedBy);

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
        <Avatar
          uri={post.avatarThumbnailUrl ?? detail?.avatarThumbnailUrl}
          name={post.displayName}
          size={36}
        />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
            {post.displayName}
          </Text>
          <Text className="mt-0.5 text-[12px] text-ink-muted">
            {new Date(post.createdAt).toLocaleDateString(LOCALES[lang])}
          </Text>
        </View>
        {onShare ? (
          <PressableScale
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel={t.shrCard}
            className="h-10 w-10 items-center justify-center rounded-full bg-raised"
          >
            <Ionicons name="share-outline" size={18} color={WorkoutTheme.text.primary} />
          </PressableScale>
        ) : null}
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
            snapToInterval={pageWidth + PAGE_GAP}
            decelerationRate="fast"
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: PAGE_GAP }}
            onMomentumScrollEnd={(e) =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / (pageWidth + PAGE_GAP)))
            }
          >
            {photo ? (
              <PressableScale
                halo={false}
                onPress={onPress}
                className="overflow-hidden rounded-tile bg-accent-tint"
                style={{ width: pageWidth, height: pageWidth }}
              >
                <Image
                  source={{ uri: photo }}
                  cachePolicy="disk"
                  contentFit="cover"
                  transition={150}
                  style={{ width: pageWidth, height: pageWidth }}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={["transparent", withAlpha(WorkoutTheme.backgroundSecondary, 0.9)]}
                  className="absolute inset-x-0 bottom-0 h-[65%]"
                />
                <View className="absolute inset-x-0 bottom-0 p-4">
                  <Text className="text-lg font-semibold text-ink" numberOfLines={2}>
                    {title}
                  </Text>
                </View>
              </PressableScale>
            ) : null}

            <PressableScale
              halo={false}
              onPress={onPress}
              className="justify-center gap-2 rounded-tile bg-raised p-5"
              style={{ width: pageWidth, height: pageWidth }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="list" size={20} color={WorkoutTheme.text.tertiary} />
                <Text className="text-xs text-ink-muted">{t.exercises}</Text>
              </View>
              {exercises && exercises.length > 0 ? (
                <View className="gap-2.5">
                  {exercises.slice(0, MAX_EXERCISES).map((exercise) => (
                    <View key={exercise.exerciseId} className="flex-row items-center gap-3">
                      <Text className="flex-1 text-sm font-semibold text-ink" numberOfLines={1}>
                        {exercise.name}
                      </Text>
                      <Text
                        className="text-xs text-ink-muted"
                        style={{ fontVariant: ["tabular-nums"] }}
                        numberOfLines={1}
                      >
                        {format(t.pcSetsCount, { n: exercise.sets })}
                        {exercise.bestSet
                          ? ` · ${exercise.bestSet.weight} kg × ${exercise.bestSet.reps}`
                          : ""}
                      </Text>
                    </View>
                  ))}
                  {exercises.length > MAX_EXERCISES ? (
                    <Text className="text-xs text-ink-muted">
                      {format(t.pcMoreExercises, { n: exercises.length - MAX_EXERCISES })}
                    </Text>
                  ) : null}
                </View>
              ) : totalExercises != null ? (
                <Text className="text-base text-ink">{totalExercises}</Text>
              ) : (
                <MentionText
                  className="text-base text-ink"
                  numberOfLines={5}
                  text={description || "–"}
                  partners={partners}
                />
              )}
            </PressableScale>

            <PressableScale
              halo={false}
              onPress={onPress}
              className="justify-center gap-5 rounded-tile bg-raised p-5"
              style={{ width: pageWidth, height: pageWidth }}
            >
              <View className="flex-row">
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
              </View>
              {stats ? (
                <View className="flex-row">
                  <Stat
                    size="md"
                    label={t.pcVolume}
                    value={
                      stats.totalVolume >= 1000
                        ? `${(stats.totalVolume / 1000).toFixed(1)} T`
                        : `${Math.round(stats.totalVolume)} kg`
                    }
                    className="flex-1"
                  />
                  <Stat size="md" label={t.sets} value={stats.totalSets} className="flex-1" />
                  <Stat size="md" label={t.pcRecords} value={stats.recordsCount} className="flex-1" />
                </View>
              ) : null}
            </PressableScale>
          </ScrollView>
        )}
      </View>

      <View className="flex-row justify-center gap-1.5">
        {Array.from({ length: photo ? 3 : 2 }, (_, i) => i).map((i) => (
          <View
            key={i}
            className={`h-1.5 rounded-full ${i === page ? "w-4 bg-accent" : "w-1.5 bg-raised"}`}
          />
        ))}
      </View>

      <PostPartners postId={post.id} partners={partners} onDeclined={setDeclinedBy} />

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
