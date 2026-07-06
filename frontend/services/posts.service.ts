import { api } from "./api";
import { TokenService } from "./token.service";

export interface Post {
  id: string,
  createdAt: string,
  displayName: string,
  likesCount: string,
  commentsCount: string,
  score: string,
  isLiked: boolean,
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
};
