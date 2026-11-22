import { useUnits } from "@/contexts/UnitsContext";
import React, { useCallback, useEffect, useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { UserService } from "@/services/user.service";
import { format } from "@/i18n/translations";
import { Post, PostsService, PostWorkout } from "@/services/posts.service";
import { duplicateWorkoutFromPost } from "@/services/workouts.service";
import RealLifeValue from "@/components/ui/RealLifeValue";
import { realLifeText } from "@/utils/realLife";
import SendToGroupSheet from "@/components/groups/SendToGroupSheet";
import ShareCardSheet, { type ShareCardData } from "@/components/share/ShareCardSheet";
import IconButton from "@/components/ui/IconButton";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import Glass from "@/components/ui/Glass";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Image } from "expo-image";
import { mediaUrl } from "@/services/api";
import Avatar from "@/components/ui/Avatar";
import MentionText from "@/components/explorePage/MentionText";
import PostPartners from "@/components/explorePage/PostPartners";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
import { PostCardSkeleton } from "@/components/ui/skeletons";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/utils/formatDate";
export default function UserPostScreen() {
  const { t, lang } = useTranslation();
  const { formatWeight, formatVolume } = useUnits();
  const insets = useSafeAreaInsets();
  const headerHeight = useFloatingHeaderHeight();
  const [menuOpen, setMenuOpen] = useState(false);
  const params = useLocalSearchParams<{ postId?: string }>();
  const routePostId = Array.isArray(params.postId) ? params.postId[0] : params.postId;
  const [post, setPost] = useState<Post | null>(null);
  const [workoutPreview, setWorkoutPreview] = useState<{
    id: string;
    title: string;
    description?: string;
    durationSeconds?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [declinedBy, setDeclinedBy] = useState<string | null>(null);
  const [postWorkout, setPostWorkout] = useState<PostWorkout | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [sendPostId, setSendPostId] = useState<string | null>(null);
  const [shareVisible, setShareVisible] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    UserService.getMe()
      .then((me) => !cancelled && setMyId(me.id))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  // Mes posts : card de partage ; ceux des autres : lien de partage.
  const isMine = !!myId && post?.userId === myId;

  const shareLink = async () => {
    if (!post) return;
    const url = Linking.createURL(`post/${post.id}`);
    try {
      await Share.share({ message: format(t.shrLinkMessage, { url }) });
    } catch {}
  };

  // Un seul appel pour tous les posts : même visibilité que le post (`404` sinon).
  const postId = post?.id;
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    PostsService.getPostWorkout(postId)
      .then((data) => !cancelled && setPostWorkout(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const duplicate = async () => {
    if (!postId || duplicating) return;
    try {
      setDuplicating(true);
      await duplicateWorkoutFromPost(postId);
      Alert.alert(t.dupDone, t.dupDoneMessage, [
        { text: "OK", style: "cancel" },
        { text: t.dupView, onPress: () => router.navigate("/(tabs)/workouts/(list)" as any) },
      ]);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setDuplicating(false);
    }
  };

  const shareData: ShareCardData | null = postWorkout
    ? {
        title: workoutPreview?.title ?? t.completedWorkoutTitle,
        username: post?.uniqueName,
        photoUrl: post?.workoutPhotoUrl,
        durationSeconds: workoutPreview?.durationSeconds,
        totalVolume: postWorkout.stats.totalVolume,
        totalSets: postWorkout.stats.totalSets,
        totalReps: postWorkout.stats.totalReps,
        realLife: postWorkout.stats.realLifeComparison,
        exercises: postWorkout.exercises.map((entry) => ({
          name: entry.exercise?.name ?? "–",
          sets: entry.sets ?? [],
        })),
      }
    : null;

  const fetchPost = useCallback(async () => {
    if (!routePostId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await PostsService.getPostById(routePostId);
      setPost(data);

      if (!data) {
        return;
      }

      const workoutId = data?.workoutId ?? data?.workout?.id;
      if (!workoutId) {
        setWorkoutPreview(null);
        return;
      }

      setWorkoutPreview({
        id: workoutId,
        title: data.workoutTitle ?? data.workout?.title ?? t.completedWorkoutTitle,
        description: data.workoutDescription ?? data.workout?.description,
        durationSeconds: data.workoutDurationSeconds,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Erreur lors du chargement du post:", message);
      Alert.alert(t.error, `${t.cannotLoadPost}\n${message}`);
    } finally {
      setLoading(false);
    }
  }, [t, routePostId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <View className="flex-1 px-5" style={{ paddingTop: 100 }}>
        <PostCardSkeleton />
      </View>
    );
  }

  const partners = post?.partners?.filter((p) => p.id !== declinedBy);
  const photo = mediaUrl(post?.workoutPhotoUrl ?? post?.workoutPhotoThumbnailUrl);

  if (!post) {
    return (
      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-ink text-lg text-center mb-5">{t.cannotLoadPost}</Text>
        <PressableScale
          className="bg-accent px-5 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-ink font-bold">{t.back}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader
        floating
        title={t.postTitle}
        right={
          workoutPreview ? (
            <IconButton
              icon="share-outline"
              variant="glass"
              label={t.shrCard}
              onPress={() => setMenuOpen((open) => !open)}
            />
          ) : undefined
        }
      />

      <ScrollView {...chromeScrollProps}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
      >
        <View className="bg-surface rounded-card p-[18px]">
          <View className="flex-row items-center mb-[18px]">
            <Avatar uri={post.avatarThumbnailUrl} name={post.displayName} size={48} className="mr-3" />

            <View className="flex-1">
              <Text className="text-ink text-lg font-bold">{post.displayName}</Text>
              <Text className="text-ink-muted text-xs mt-0.5">
                {formatDate(post.createdAt, lang, "dayLong")}
              </Text>
            </View>
          </View>

          {photo ? (
            <Image
              source={{ uri: photo }}
              cachePolicy="disk"
              contentFit="cover"
              transition={150}
              accessibilityLabel={workoutPreview?.title}
              style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 22, marginBottom: 18 }}
            />
          ) : null}
          <PostPartners
            postId={post.id}
            partners={partners}
            onDeclined={setDeclinedBy}
            className="mb-[18px]"
          />

          {workoutPreview ? (
            <View className="mt-2">
              <Text className="text-ink-soft text-xs font-semibold mb-2.5 uppercase">{t.linkedWorkout}</Text>
              <View className="bg-raised rounded-tile p-3.5 flex-row items-center">
                <View className="w-11 h-11 rounded-full bg-success-tint items-center justify-center mr-3">
                  <Ionicons name="checkmark-circle" size={26} color={WorkoutTheme.status.success} />
                </View>
                <View className="flex-1">
                  <MentionText
                    className="text-ink text-base font-bold"
                    text={workoutPreview.title}
                    partners={partners}
                  />
                  {!!workoutPreview.description && (
                    <MentionText
                      className="text-ink-soft text-[13px] mt-1"
                      text={workoutPreview.description}
                      partners={partners}
                    />
                  )}
                  {workoutPreview.durationSeconds !== undefined && (
                    <Text className="text-ink-muted text-xs mt-1.5">
                      {Math.round(workoutPreview.durationSeconds / 60)} min
                    </Text>
                  )}
                </View>
                <PressableScale
                  halo={false}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t.dupButton}
                  disabled={duplicating}
                  className={`ml-3 ${duplicating ? "opacity-50" : ""}`}
                  onPress={duplicate}
                >
                  <Ionicons name="copy-outline" size={22} color={WorkoutTheme.text.primary} />
                </PressableScale>
              </View>
              {postWorkout ? (
                <View className="flex-row flex-wrap gap-2.5 mt-3.5">
                  {[
                    { label: t.calories, value: String(Math.round(postWorkout.stats.estimatedCalories)) },
                    { label: t.volumeLabel, value: formatVolume(postWorkout.stats.totalVolume) },
                    { label: t.sets, value: String(postWorkout.stats.totalSets) },
                    { label: t.repsLabel, value: String(postWorkout.stats.totalReps) },
                  ].map((tile) => (
                    <View
                      key={tile.label}
                      className="bg-raised rounded-tile p-3.5"
                      style={{ width: "48%", flexGrow: 1 }}
                    >
                      <Text className="text-ink text-lg font-bold">{tile.value}</Text>
                      <Text className="text-ink-muted text-xs mt-0.5">{tile.label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {realLifeText(t, postWorkout?.stats.realLifeComparison) ? (
                <View className="mt-2.5 flex-row items-center gap-2 rounded-tile bg-accent-tint p-3.5">
                  <Ionicons name="earth" size={18} color={WorkoutTheme.accent.purple} />
                  <Text className="flex-1 text-ink-muted text-xs">{t.rlTitle}</Text>
                  <RealLifeValue comparison={postWorkout?.stats.realLifeComparison} />
                </View>
              ) : null}

              {postWorkout && postWorkout.exercises.length > 0 ? (
                <View className="mt-[18px] gap-2.5">
                  <Text className="text-ink-soft text-xs font-semibold uppercase">{t.exercises}</Text>
                  {postWorkout.exercises.map((entry) => (
                    <View key={entry.id} className="bg-raised rounded-tile p-3.5 gap-2">
                      <Text className="text-ink text-base font-bold">
                        {entry.exercise?.name ?? "–"}
                      </Text>
                      {(entry.sets ?? []).map((set, index) => (
                        <View
                          key={index}
                          className="flex-row items-center justify-between rounded-full bg-line px-4 py-2.5"
                        >
                          <Text className="text-ink-muted text-sm">
                            {t.setLabel} {index + 1}
                          </Text>
                          <Text className="text-ink text-sm font-semibold">
                            {formatWeight(set.weight)} × {set.reps}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <EmptyState plain icon="barbell-outline" title={t.noLinkedWorkout} />
          )}

        </View>
      </ScrollView>

      {menuOpen ? (
        <>
          <Pressable
            accessibilityLabel={t.back}
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuOpen(false)}
          />
          <Animated.View
            entering={FadeInUp.duration(180)}
            className="absolute right-5 z-30 w-64"
            style={{ top: insets.top + 12 + 44 + 8 }}
          >
          <Glass className="rounded-card">
            <PressableScale
              halo={false}
              className="flex-row items-center gap-3 px-4 py-4"
              onPress={() => {
                setMenuOpen(false);
                setSendPostId(post.id);
              }}
            >
              <Ionicons name="people-outline" size={20} color={WorkoutTheme.text.primary} />
              <Text className="flex-1 text-[15px] font-semibold text-ink">{t.grpSend}</Text>
            </PressableScale>
            <View className="mx-4 h-[1px] bg-line" />
            <PressableScale
              halo={false}
              disabled={isMine && !shareData}
              className={`flex-row items-center gap-3 px-4 py-4 ${!isMine || shareData ? "" : "opacity-50"}`}
              onPress={() => {
                setMenuOpen(false);
                if (isMine) setShareVisible(true);
                else shareLink();
              }}
            >
              <Ionicons
                name={isMine ? "albums-outline" : "link-outline"}
                size={20}
                color={WorkoutTheme.text.primary}
              />
              <Text className="flex-1 text-[15px] font-semibold text-ink">
                {isMine ? t.shrCardTitle : t.shrLinkTitle}
              </Text>
            </PressableScale>
          </Glass>
          </Animated.View>
        </>
      ) : null}

      <SendToGroupSheet postId={sendPostId} onClose={() => setSendPostId(null)} />
      <ShareCardSheet
        visible={shareVisible}
        data={shareData}
        onClose={() => setShareVisible(false)}
      />
    </View>
  );
}
