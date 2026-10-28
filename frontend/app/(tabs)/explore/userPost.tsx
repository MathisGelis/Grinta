import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Post, PostsService } from "@/services/posts.service";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { LOCALES } from "@/i18n/labels";
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
      <View className="flex-row items-center justify-between px-4 pt-16 pb-4">
        <PressableScale onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <Text className="text-ink text-lg font-bold flex-1 text-center">{t.postTitle}</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <View className="bg-surface rounded-tile p-[18px] border border-raised">
          <View className="flex-row items-center mb-[18px]">
            <View className="w-12 h-12 rounded-card bg-accent-tint items-center justify-center mr-3">
              <Text className="text-ink text-lg font-bold">
                {post.displayName?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>

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

          {workoutPreview ? (
            <View className="mt-2">
              <Text className="text-ink-soft text-xs font-semibold mb-2.5 uppercase">{t.linkedWorkout}</Text>
              <View className="bg-background rounded-tile p-3.5 flex-row items-center">
                <View className="w-11 h-11 rounded-full bg-success-tint items-center justify-center mr-3">
                  <Ionicons name="checkmark-circle" size={26} color={WorkoutTheme.status.success} />
                </View>
                <View className="flex-1">
      <ScreenBackground />
                  <Text className="text-ink text-base font-bold">
                    {workoutPreview.title}
                  </Text>
                  {!!workoutPreview.description && (
                    <Text className="text-ink-soft text-[13px] mt-1">
                      {workoutPreview.description}
                    </Text>
                  )}
                  {workoutPreview.durationSeconds !== undefined && (
                    <Text className="text-ink-muted text-xs mt-1.5">
                      {Math.round(workoutPreview.durationSeconds / 60)} min
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-background rounded-tile p-[18px] items-center justify-center">
              <Text className="text-ink-muted text-sm">
                {t.noLinkedWorkout}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
