import { View, Text, Alert } from "react-native";
import { CompletedWorkout } from "@/services/workout.service";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { PostsService } from "@/services/posts.service";
import SectionHeader from "@/components/ui/SectionHeader";
import { useTranslation } from "@/contexts/LanguageContext";

import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { format } from "@/i18n/translations";
type RecentWorkoutProps = {
  recentWorkouts: CompletedWorkout[];
};

export default function RecentWorkout({ recentWorkouts }: RecentWorkoutProps) {
  const { t } = useTranslation();
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const handlePublishWorkout = (workout: CompletedWorkout) => {
    const isPublished = publishedIds.has(workout.id);
    Alert.alert(
      isPublished ? t.removePublication : t.publish,
      isPublished
        ? format(t.unpublishConfirm, { title: workout.title })
        : format(t.publishConfirm, { title: workout.title }),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: isPublished ? t.remove : t.publish,
          onPress: async () => {
            try {
              if (isPublished) {
                setPublishedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(workout.id);
                  return next;
                });
              } else {
                await PostsService.createPost(workout.id);
                setPublishedIds((prev) => new Set(prev).add(workout.id));
              }
            } catch {
              Alert.alert(t.error, t.cannotUpdatePublication);
            }
          },
        },
      ],
    );
  };

  return (
    <>
      {recentWorkouts.length > 0 && (
        <View className="gap-4">
          <SectionHeader title={t.newWorkouts} />
          <View className="gap-3">
            {recentWorkouts.map((w) => (
              <View
                key={w.id}
                className="flex-row items-center gap-3 rounded-card bg-surface p-4"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-success-tint">
                  <Ionicons name="checkmark" size={22} color={WorkoutTheme.status.success} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                    {w.title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-ink-muted">
                    {Math.round(w.totalDurationSeconds / 60)} min
                  </Text>
                </View>
                <PressableScale
                  onPress={() => handlePublishWorkout(w)}
                  accessibilityRole="button"
                  accessibilityLabel={publishedIds.has(w.id) ? t.removePublication : t.publish}
                  className={`h-11 w-11 items-center justify-center rounded-full ${
                    publishedIds.has(w.id) ? "bg-success-tint" : "bg-raised"
                  }`}
                >
                  <Ionicons
                    name={publishedIds.has(w.id) ? "cloud-done" : "cloud-upload-outline"}
                    size={20}
                    color={publishedIds.has(w.id) ? WorkoutTheme.status.success : WorkoutTheme.text.tertiary}
                  />
                </PressableScale>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}
