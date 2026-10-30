import React, { useCallback, useEffect, useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Post, PostsService, PostWorkout } from "@/services/posts.service";
import { duplicateWorkoutFromPost } from "@/services/workouts.service";
import { realLifeText } from "@/utils/realLife";
import SendToGroupSheet from "@/components/groups/SendToGroupSheet";
import ShareCardSheet, { type ShareCardData } from "@/components/share/ShareCardSheet";
import Button from "@/components/ui/Button";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { Image } from "expo-image";
import { mediaUrl } from "@/services/api";
import Avatar from "@/components/ui/Avatar";
import MentionText from "@/components/explorePage/MentionText";
import PostPartners from "@/components/explorePage/PostPartners";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { LOCALES } from "@/i18n/labels";
const formatVolume = (volume: number) =>
  volume >= 1000 ? `${(volume / 1000).toFixed(1)} T` : `${Math.round(volume)} kg`;

export default function UserPostScreen() {
  const { t, lang } = useTranslation();
  const params = useLocalSearchParams<{ post?: string }>();
  const serializedPost = Array.isArray(params.post)
    ? params.post[0]
    : params.post;
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
    if (!serializedPost) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fromFeed = JSON.parse(serializedPost) as Post;
      const detail = await PostsService.getPostById(fromFeed.id).catch(() => null);
      const data = { ...fromFeed, ...(detail ?? {}) } as Post;
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
  }, [t, serializedPost]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center px-5">
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
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
      <View className="flex-row items-center justify-between px-4 pt-16 pb-4">
        <PressableScale onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <Text className="text-ink text-lg font-bold flex-1 text-center">{t.postTitle}</Text>
        <View className="w-10" />
      </View>

      <ScrollView {...chromeScrollProps}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View className="bg-surface rounded-card p-[18px]">
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
          <View className="flex-row items-center mb-[18px]">
            <Avatar uri={post.avatarThumbnailUrl} name={post.displayName} size={48} className="mr-3" />

            <View className="flex-1">
              <Text className="text-ink text-lg font-bold">{post.displayName}</Text>
              <Text className="text-ink-muted text-xs mt-0.5">
                {new Date(post.createdAt).toLocaleDateString(LOCALES[lang], {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          <View className="bg-background rounded-tile p-3.5 mb-[18px]">
            <Text className="text-ink-soft text-xs font-semibold mb-2 uppercase">{t.postDetails}</Text>
            <Text className="text-ink text-[15px] mb-1.5">
              {format(t.postedOn, { date: new Date(post.createdAt).toLocaleString(LOCALES[lang]) })}
            </Text>
          </View>

          <PostPartners
            postId={post.id}
            partners={partners}
            onDeclined={setDeclinedBy}
            className="mb-[18px]"
          />

          {workoutPreview ? (
            <View className="mt-2">
              <Text className="text-ink-soft text-xs font-semibold mb-2.5 uppercase">{t.linkedWorkout}</Text>
              <View className="bg-background rounded-tile p-3.5 flex-row items-center">
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
                      className="bg-background rounded-tile p-3.5"
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
                  <View className="flex-1">
                    <Text className="text-ink-muted text-xs">{t.rlTitle}</Text>
                    <Text className="text-ink text-sm font-semibold">
                      {realLifeText(t, postWorkout?.stats.realLifeComparison)}
                    </Text>
                  </View>
                </View>
              ) : null}

              {postWorkout && postWorkout.exercises.length > 0 ? (
                <View className="mt-[18px] gap-2.5">
                  <Text className="text-ink-soft text-xs font-semibold uppercase">{t.exercises}</Text>
                  {postWorkout.exercises.map((entry) => (
                    <View key={entry.id} className="bg-background rounded-tile p-3.5 gap-2">
                      <Text className="text-ink text-base font-bold">
                        {entry.exercise?.name ?? "–"}
                      </Text>
                      {(entry.sets ?? []).map((set, index) => (
                        <View
                          key={index}
                          className="flex-row items-center justify-between rounded-full bg-raised px-4 py-2.5"
                        >
                          <Text className="text-ink-muted text-sm">
                            {t.setLabel} {index + 1}
                          </Text>
                          <Text className="text-ink text-sm font-semibold">
                            {set.weight} kg × {set.reps}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <View className="bg-background rounded-tile p-[18px] items-center justify-center">
              <Text className="text-ink-muted text-sm">
                {t.noLinkedWorkout}
              </Text>
            </View>
          )}

          {workoutPreview ? (
            <View className="mt-[18px] gap-2.5">
              <View className="flex-row gap-2.5">
                <Button
                  className="flex-1"
                  variant="secondary"
                  icon="copy-outline"
                  label={t.dupButton}
                  loading={duplicating}
                  onPress={duplicate}
                />
                <Button
                  className="flex-1"
                  variant="secondary"
                  icon="people-outline"
                  label={t.grpSend}
                  onPress={() => setSendPostId(post.id)}
                />
              </View>
              <Button
                variant="secondary"
                icon="share-outline"
                label={t.shrCard}
                disabled={!shareData}
                onPress={() => setShareVisible(true)}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SendToGroupSheet postId={sendPostId} onClose={() => setSendPostId(null)} />
      <ShareCardSheet
        visible={shareVisible}
        data={shareData}
        onClose={() => setShareVisible(false)}
      />
    </View>
  );
}
