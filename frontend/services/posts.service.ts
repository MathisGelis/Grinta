import { api } from "./api";
import { TokenService } from "./token.service";

export interface Post {
  id: string,
  createdAt: string,
  displayName: string,
  likesCount?: string,
  commentsCount?: string,
  score?: string,
  isLiked?: boolean,
  workoutId?: string,
  workoutTitle?: string,
  workoutDescription?: string,
  workoutDurationSeconds?: number,
  workoutCompletionDate?: string,
  workout?: {
    id?: string,
    title?: string,
    description?: string,
    totalExercises?: number,
  },
}

export interface PostLike {
  id: string,
  displayName: string,
  uniqueName: string,
  createdAt: string,
}

export const PostsService = {
  async createPost(workoutId: string): Promise<{ id: string }> {
    const token = await TokenService.get();
    return api.post<{ id: string }>("/posts", { workoutId }, token ?? undefined);
  },

  async deletePost(postId: string): Promise<void> {
    const token = await TokenService.get();
    return api.delete(`/posts/${postId}`, token ?? undefined);
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

  async getPostById(postId: string): Promise<Post | null> {
    const token = await TokenService.get();
    return api.get<Post | null>(`/posts/${encodeURIComponent(postId)}`, token ?? undefined);
  },
  async likePost(postId: string): Promise<void> {
    const token = await TokenService.get();
    return api.patch(`/posts/${postId}/like`, {}, token ?? undefined);
  },
  async getPostLikes(postId: string): Promise<PostLike[]> {
    const token = await TokenService.get();
    return api.get(`/posts/${postId}/likes`, token ?? undefined);
  },
  async getPostComments(postId: string): Promise<any[]> {
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
  async reportComment(commentId: string, reason: string): Promise<void> {
    const token = await TokenService.get();
    return api.post(`/posts/comments/${commentId}/report`, { reason }, token ?? undefined);
  }
};

