import { api } from "./api";
import { TokenService } from "./token.service";

export interface UserListItem {
  id: string;
  uniqueName: string;
  displayName: string;
  avatarThumbnailUrl?: string | null;
}

export interface FollowRequest {
  request_id: string;
  request_createdAt: string;
  user_id: string;
  user_displayName: string;
  user_uniqueName: string;
  user_avatarThumbnailUrl?: string | null;
}

/** Taille d'une page d'abonnés / abonnements (le serveur plafonne à 100). */
export const FOLLOW_PAGE_SIZE = 50;

export const ConnectionsService = {
  async follow(userId: string) {
    const token = await TokenService.get();
    return api.post<{ status: string }>(`/connections/${userId}/follow`, undefined, token ?? undefined);
  },

  async unfollow(userId: string) {
    const token = await TokenService.get();
    return api.delete<{ message: string }>(`/connections/${userId}/unfollow`, token ?? undefined);
  },

  async getFollowers(userId: string, offset = 0, limit = FOLLOW_PAGE_SIZE): Promise<UserListItem[]> {
    const token = await TokenService.get();
    return api.get<UserListItem[]>(
      `/connections/${userId}/followers?limit=${limit}&offset=${offset}`,
      token ?? undefined,
    );
  },

  async getFollowing(userId: string, offset = 0, limit = FOLLOW_PAGE_SIZE): Promise<UserListItem[]> {
    const token = await TokenService.get();
    return api.get<UserListItem[]>(
      `/connections/${userId}/following?limit=${limit}&offset=${offset}`,
      token ?? undefined,
    );
  },

  async getFollowStatus(userId: string): Promise<string> {
    const token = await TokenService.get();
    return api.get<string>(`/connections/${userId}/status`, token ?? undefined);
  },

  async getRecommendations(): Promise<UserListItem[]> {
    const token = await TokenService.get();
    return api.get<UserListItem[]>("/connections/recommendations", token ?? undefined);
  },

  async getRequests(): Promise<FollowRequest[]> {
    const token = await TokenService.get();
    return api.get<FollowRequest[]>("/connections/requests", token ?? undefined);
  },

  async acceptRequest(requestId: string) {
    const token = await TokenService.get();
    return api.post<{ message: string }>(`/connections/requests/${requestId}/accept`, undefined, token ?? undefined);
  },

  async rejectRequest(requestId: string) {
    const token = await TokenService.get();
    return api.delete<{ message: string }>(`/connections/requests/${requestId}`, token ?? undefined);
  },

  async searchUsers(query: string): Promise<UserListItem[]> {
    const token = await TokenService.get();
    return api.get<UserListItem[]>(`/users/search?q=${encodeURIComponent(query)}`, token ?? undefined);
  },
};
