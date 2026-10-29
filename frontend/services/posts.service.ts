import { api } from "./api";
import { TokenService } from "./token.service";
import { type PostPartner } from "./user.service";

export type { PostPartner };

export interface Post {
  id: string,
  createdAt: string,
  userId?: string,
  displayName: string,
  uniqueName?: string,
  avatarThumbnailUrl?: string | null,
  likesCount?: number,
  commentsCount?: number,
  score?: number,
  isLiked?: boolean,
  workoutId?: string,
  workoutTitle?: string,
  workoutDescription?: string,
  workoutDurationSeconds?: number,
  workoutCompletionDate?: string,
  workoutPhotoUrl?: string | null,
  workoutPhotoThumbnailUrl?: string | null,
  partners?: PostPartner[],
  workout?: {
    id?: string,
    title?: string,
    description?: string,
    totalExercises?: number,
  },
}

export interface MyPost {
  id: string,
  createdAt: string,
  workoutId: string,
  workoutTitle?: string,
  workoutCompletionDate?: string,
  workoutPhotoUrl?: string | null,
  workoutPhotoThumbnailUrl?: string | null,
  likesCount?: number,
  commentsCount?: number,
  partners?: PostPartner[],
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "inappropriate"
  | "other";

interface PostLike {
  id: string;
  displayName: string;
  uniqueName: string;
  avatarThumbnailUrl?: string | null;
  createdAt: string;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  displayName: string;
  avatarThumbnailUrl?: string | null;
}

export const PostsService = {
  async createPost(workoutId: string): Promise<{ id: string; partners?: PostPartner[] }> {
    const token = await TokenService.get();
    return api.post<{ id: string; partners?: PostPartner[] }>("/posts", { workoutId }, token ?? undefined);
  },

  /** Posts de l'utilisateur connecté, avec l'id de la séance publiée. */
  async getMyPosts(limit = 100): Promise<MyPost[]> {
    const token = await TokenService.get();
    return api.get<MyPost[]>(`/posts/mine?limit=${limit}`, token ?? undefined);
  },

  /** L'utilisateur connecté se retire des partenaires d'un post (définitif). */
  async declinePartner(postId: string): Promise<{ declined: boolean }> {
    const token = await TokenService.get();
    return api.delete<{ declined: boolean }>(`/posts/${postId}/partners/me`, token ?? undefined);
  },

  async deletePost(postId: string): Promise<void> {
    const token = await TokenService.get();
    return api.delete(`/posts/${postId}`, token ?? undefined);
  },

  async getPostById(postId: string): Promise<Post | null> {
    const token = await TokenService.get();
    return api.get<Post | null>(`/posts/${encodeURIComponent(postId)}`, token ?? undefined);
  },

  async getTopPosts(limit: number): Promise<Post[]> {
    const token = await TokenService.get();

    try {
      const response = await api.get<Post[] | null>(`/posts/feed/top?limit=${limit}`, token ?? undefined);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des top posts:", error);
      return [];
    }
  },

  async getFollowedPosts(limit: number): Promise<Post[]> {
    const token = await TokenService.get();

    try {
      const response = await api.get<Post[] | null>(`/posts/feed/following?limit=${limit}`, token ?? undefined);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des posts suivis:", error);
      return [];
    }
  },

  async likePost(postId: string): Promise<void> {
    const token = await TokenService.get();
    return api.patch(`/posts/${postId}/like`, {}, token ?? undefined);
  },
  async getPostLikes(postId: string): Promise<PostLike[]> {
    const token = await TokenService.get();
    return api.get(`/posts/${postId}/likes`, token ?? undefined);
  },
  async getPostComments(postId: string): Promise<PostComment[]> {
    const token = await TokenService.get();
    return api.get(`/posts/${postId}/comments`, token ?? undefined);
  },
  async commentOnPost(postId: string, comment: string): Promise<void> {
    const token = await TokenService.get();
    return api.post(`/posts/${postId}/comments`, { content: comment }, token ?? undefined);
  },
  async EditComment(commentId: string, newContent: string): Promise<void> {
    const token = await TokenService.get();
    return api.patch(`/posts/comments/${commentId}`, { content: newContent }, token ?? undefined);
  },
  async deleteComment(commentId: string): Promise<void> {
    const token = await TokenService.get();
    return api.delete(`/posts/comments/${commentId}`, token ?? undefined);
  },
  async reportComment(commentId: string, reason: ReportReason): Promise<void> {
    const token = await TokenService.get();
    return api.post(`/posts/comments/${commentId}/report`, { reason }, token ?? undefined);
  },

  async getPublishedWorkoutMap(): Promise<Record<string, string>> {
    const posts = await PostsService.getMyPosts();
    const map: Record<string, string> = {};
    for (const post of posts) {
      if (post.workoutId) map[post.workoutId] = post.id;
    }
    return map;
  },
};
