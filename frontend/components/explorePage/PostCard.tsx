import { formatDate } from "@/utils/formatDate";
import { useUnits } from "@/contexts/UnitsContext";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { WorkoutTheme } from "@/constants/Colors";
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
import PostShareMenu from "@/components/share/PostShareMenu";

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

const PAGE_GAP = 8;
const MAX_EXERCISES = 5;
// Page carrée à padding p-5 : avec MAX_EXERCISES lignes, l'espacement fait exactement remplir la hauteur.
const PAGE_PADDING = 20;
const HEADER_ROW_H = 20;
const HEADER_GAP = 16;
const EXERCISE_ROW_H = 20;

function LikeHeart({ liked }: { liked: boolean }) {
  const scale = useSharedValue(1);
  const first = React.useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.set(
      liked
        ? withSequence(
            withTiming(1.3, { duration: 220, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
          )
        : withSequence(
            withTiming(0.8, { duration: 160, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }),
          ),
    );
  }, [liked, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={animated}>
      <Ionicons
        name={liked ? "heart" : "heart-outline"}
        size={20}
        color={WorkoutTheme.status.danger}
      />
    </Animated.View>
  );
}

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
  const { formatWeight, formatVolume } = useUnits();
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Post | undefined>(details.get(post.id));
  const [declinedBy, setDeclinedBy] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

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

  // Avec le maximum d'exercices (et la ligne « +N » s'il y en a plus), la liste remplit toute la hauteur.
  const hasMoreExercises = (exercises?.length ?? 0) > MAX_EXERCISES;
  const listRows = MAX_EXERCISES + (hasMoreExercises ? 1 : 0);
  const exerciseGap = Math.max(
    6,
    (pageWidth - 2 * PAGE_PADDING - HEADER_ROW_H - HEADER_GAP - listRows * EXERCISE_ROW_H) /
      (listRows - 1),
  );

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
            {formatDate(post.createdAt, lang)}
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

      <View className="gap-1 px-1">
        <Text className="text-lg font-semibold text-ink" numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <MentionText
            className="text-sm text-ink-soft"
            numberOfLines={3}
            text={description}
            partners={partners}
          />
        ) : null}
      </View>

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
              <Pressable
                onPress={onPress}
                className="overflow-hidden rounded-tile bg-accent-tint active:opacity-80"
                style={{ width: pageWidth, height: pageWidth }}
              >
                <Image
                  source={{ uri: photo }}
                  cachePolicy="disk"
                  contentFit="cover"
                  transition={150}
                  style={{ width: pageWidth, height: pageWidth }}
                />
              </Pressable>
            ) : null}

            <Pressable
              onPress={onPress}
              className="rounded-tile bg-raised p-5 active:opacity-80"
              style={{ width: pageWidth, height: pageWidth, gap: HEADER_GAP }}
            >
              <View className="flex-row items-center gap-2" style={{ height: HEADER_ROW_H }}>
                <Ionicons name="list" size={20} color={WorkoutTheme.text.tertiary} />
                <Text className="flex-1 text-xs text-ink-muted">{t.exercises}</Text>
              </View>
              {exercises && exercises.length > 0 ? (
                <View style={{ gap: exerciseGap }}>
                  {exercises.slice(0, MAX_EXERCISES).map((exercise) => (
                    <View
                      key={exercise.exerciseId}
                      className="flex-row items-center gap-3"
                      style={{ height: EXERCISE_ROW_H }}
                    >
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
                          ? ` · ${formatWeight(exercise.bestSet.weight)} × ${exercise.bestSet.reps}`
                          : ""}
                      </Text>
                    </View>
                  ))}
                  {exercises && exercises.length > MAX_EXERCISES ? (
                    <Text
                      className="text-xs text-ink-muted"
                      style={{ height: EXERCISE_ROW_H, lineHeight: EXERCISE_ROW_H }}
                    >
                      {format(t.pcMoreExercises, { n: exercises.length - MAX_EXERCISES })}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View className="flex-1 justify-center">
                  {totalExercises != null ? (
                    <Text className="text-base text-ink">{totalExercises}</Text>
                  ) : (
                    <MentionText
                      className="text-base text-ink"
                      numberOfLines={5}
                      text={description || "–"}
                      partners={partners}
                    />
                  )}
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={onPress}
              className="gap-2 rounded-tile bg-raised p-5 active:opacity-80"
              style={{ width: pageWidth, height: pageWidth }}
            >
              <View className="flex-row items-center gap-2" style={{ height: HEADER_ROW_H }}>
                <Ionicons name="stats-chart" size={20} color={WorkoutTheme.text.tertiary} />
                <Text className="text-xs text-ink-muted">{t.profileTabStats}</Text>
              </View>
              <View className="flex-1 flex-row items-center">
                <Stat
                  size="md"
                  label={t.duration}
                  value={duration != null ? `${Math.round(duration / 60)} min` : "–"}
                  className="flex-1 items-center"
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
                  className="flex-1 items-center"
                />
              </View>
              {stats ? (
                <View className="flex-1 flex-row items-center">
                  <Stat
                    size="md"
                    label={t.pcVolume}
                    value={
                      formatVolume(stats.totalVolume)
                    }
                    className="flex-1 items-center"
                  />
                  <Stat size="md" label={t.sets} value={stats.totalSets} className="flex-1 items-center" />
                  <Stat size="md" label={t.pcRecords} value={stats.recordsCount} className="flex-1 items-center" />
                </View>
              ) : null}
            </Pressable>
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
          onPress={() => {
            if (onToggleLike) {
              if (post.isLiked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onToggleLike();
            } else {
              onShowLikes?.();
            }
          }}
          onLongPress={onShowLikes}
          delayLongPress={300}
        >
          <LikeHeart liked={!!post.isLiked} />
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
        <PressableScale
          className="flex-row items-center gap-1 px-6 py-1"
          accessibilityRole="button"
          accessibilityLabel={t.shrCard}
          onPress={() => setShareOpen(true)}
        >
          <Ionicons name="share-outline" size={20} color={WorkoutTheme.text.primary} />
        </PressableScale>
      </View>
      <PostShareMenu postId={shareOpen ? post.id : null} onClose={() => setShareOpen(false)} />
    </View>
  );
}
