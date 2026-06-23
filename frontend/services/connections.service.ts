import { api } from "./api";
import { TokenService } from "./token.service";

export interface UserListItem {
  id: string;
  uniqueName: string;
  displayName: string;
}

export interface FollowRequest {
  request_id: string;
  request_createdAt: string;
  user_id: string;
  user_displayName: string;
  user_uniqueName: string;
}

export const ConnectionsService = {
  async follow(userId: string) {
    const token = await TokenService.get();
    return api.post<{ status: string }>(`/connections/${userId}/follow`, undefined, token ?? undefined);
  },

  async unfollow(userId: string) {
    const token = await TokenService.get();
    return api.delete<{ message: string }>(`/connections/${userId}/unfollow`, token ?? undefined);
  },

  async getFollowers(userId: string): Promise<UserListItem[]> {
    const token = await TokenService.get();
    return api.get<UserListItem[]>(`/connections/${userId}/followers`, token ?? undefined);
  },

  async getFollowing(userId: string): Promise<UserListItem[]> {
    const token = await TokenService.get();
    return api.get<UserListItem[]>(`/connections/${userId}/following`, token ?? undefined);
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
