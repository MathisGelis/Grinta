import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { Post, PostsService } from "@/services/posts.service";
import type { ProfilePost } from "@/services/user.service";
import PressableScale from "@/components/ui/PressableScale";
import PostCard from "@/components/explorePage/PostCard";
import EmptyState from "@/components/ui/EmptyState";

type Props = {
  posts: ProfilePost[];
  authorName: string;
  authorId?: string;
  onDeleted?: (postId: string) => void;
  /** Profil d'un autre utilisateur : ni ajout, ni suppression. */
  readOnly?: boolean;
  onOpenPost?: (post: Post) => void;
  onShowLikes?: (postId: string) => void;
  onShowComments?: (postId: string) => void;
};

export default function MyPostsSection({
  posts,
  authorName,
  authorId,
  onDeleted,
  readOnly = false,
  onOpenPost,
  onShowLikes,
  onShowComments,
}: Props) {
  const { t } = useTranslation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = useCallback(
    (postId: string) => {
      Alert.alert(t.deletePostTitle, t.deletePostConfirm, [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(postId);
              await PostsService.deletePost(postId);
              onDeleted?.(postId);
            } catch {
              Alert.alert(t.error, t.cannotDeletePost);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]);
    },
    [t, onDeleted],
  );

  const toPost = (post: ProfilePost): Post => ({
    id: post.id,
    createdAt: post.createdAt,
    displayName: authorName,
    userId: authorId,
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    isLiked: post.isLiked,
    workoutPhotoThumbnailUrl: post.workoutPhotoThumbnailUrl,
    partners: post.partners,
    exercises: post.exercises,
    stats: post.stats,
  });

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-ink">
          {`${t.myPostsTitle} (${posts.length})`}
        </Text>
        {readOnly ? null : (
          <PressableScale
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel={t.add}
            className="h-10 w-10 items-center justify-center rounded-full bg-accent"
          >
            <Ionicons name="add" size={22} color={WorkoutTheme.text.primary} />
          </PressableScale>
        )}
      </View>

      {posts.length === 0 ? (
        <EmptyState icon="images-outline" title={t.noPostsYet} message={t.noPostsHint} />
      ) : (
        <View className="gap-3">
          {posts.map((post) => {
            const asPost = toPost(post);
            return (
              <PostCard
                key={post.id}
                post={asPost}
                authorPressable={false}
                deleting={deletingId === post.id}
                onDelete={readOnly ? undefined : () => confirmDelete(post.id)}
                onPress={onOpenPost ? () => onOpenPost(asPost) : undefined}
                onShowLikes={onShowLikes ? () => onShowLikes(post.id) : undefined}
                onShowComments={onShowComments ? () => onShowComments(post.id) : undefined}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
