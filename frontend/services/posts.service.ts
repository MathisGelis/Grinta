import { api } from "./api";
import { TokenService } from "./token.service";

export const PostsService = {
  async createPost(workoutId: string): Promise<{ id: string }> {
    const token = await TokenService.get();
    return api.post<{ id: string }>("/posts", { workoutId }, token ?? undefined);
  },

  async deletePost(postId: string): Promise<void> {
    const token = await TokenService.get();
    return api.delete(`/posts/${postId}`, token ?? undefined);
  },
};
