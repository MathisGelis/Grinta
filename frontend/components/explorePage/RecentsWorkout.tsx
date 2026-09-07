import { View, Text, TouchableOpacity, Alert } from "react-native";
import { CompletedWorkout } from "@/services/workout.service";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { PostsService } from "@/services/posts.service";
import { useTranslation } from "@/contexts/LanguageContext";

type RecentWorkoutProps = {
  recentWorkouts: CompletedWorkout[];
};

export default function RecentWorkout({ recentWorkouts }: RecentWorkoutProps) {
  const { t } = useTranslation();
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const handlePublishWorkout = (workout: CompletedWorkout) => {
    const isPublished = publishedIds.has(workout.id);
    Alert.alert(
      isPublished ? "Retirer la publication" : "Publier",
      isPublished
        ? `Retirer "${workout.title}" du feed ?`
        : `Publier "${workout.title}" dans le feed ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: isPublished ? "Retirer" : "Publier",
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
              Alert.alert("Erreur", "Impossible de modifier la publication.");
            }
          },
        },
      ],
    );
  };

  return (
    <>
      {recentWorkouts.length > 0 && (
        <>
          <View className="mx-4 mt-4 mb-3 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-white">
              {t.newWorkouts}
            </Text>
          </View>

          {recentWorkouts.map((w) => (
            <View
              key={w.id}
              className="mb-2 mx-4 flex-row items-center gap-3 rounded-2xl bg-[#1a1a1a] px-4 py-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#1a2f1a]">
                <Ionicons name="checkmark-circle" size={24} color="#34D399" />
              </View>
              <View className="flex-1">
                <Text className="mb-0.5 text-[15px] font-semibold text-white">
                  {w.title}
                </Text>
                <Text className="text-[12px] text-[#888]">
                  {Math.round(w.totalDurationSeconds / 60)} min
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handlePublishWorkout(w)}
                className={`h-9 w-9 items-center justify-center rounded-xl ${
                  publishedIds.has(w.id) ? "bg-[#1a2a1a]" : "bg-[#1a1a2a]"
                }`}
              >
                <Ionicons
                  name={
                    publishedIds.has(w.id)
                      ? "cloud-done"
                      : "cloud-upload-outline"
                  }
                  size={18}
                  color={publishedIds.has(w.id) ? "#34D399" : "#888"}
                />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </>
  );
}
