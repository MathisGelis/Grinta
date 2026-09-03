import { api } from "./api";
import { TokenService } from "./token.service";

export interface UserProfile {
  id: string;
  displayName: string;
  uniqueName: string;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  postsCount: number;
  followStatus: string;
  posts?: any[];
  isPrivate: boolean;
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  uniqueName: string;
  createdAt: string;
}

export interface UpdateUserData {
  displayName?: string;
  uniqueName?: string;
  email?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
}

export interface SearchUser {
  id: string;
  uniqueName: string;
  displayName: string;
  image_url: string;
}

export const UserService = {
  async updateProfile(userId: string, data: UpdateUserData) {
    const token = await TokenService.get();
    return api.patch<CurrentUser>(`/users/${userId}`, data, token ?? undefined);
  },

  async getMe(): Promise<CurrentUser> {
    const token = await TokenService.get();
    const me = await api.get<{ id: string; email: string }>("/auth/me", token ?? undefined);
    const full = await api.get<CurrentUser>(`/users/${me.id}`, token ?? undefined);
    return full;
  },

  /** Resolves the id from the token rather than storage: user_id is only
   *  written at registration, so it is missing for anyone who just logged in. */
  async deleteAccount(): Promise<void> {
    const token = await TokenService.get();
    const me = await api.get<{ id: string }>("/auth/me", token ?? undefined);
    await api.delete(`/users/${me.id}`, token ?? undefined);
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const token = await TokenService.get();
    return api.get<UserProfile>(`/users/${userId}/profile`, token ?? undefined);
  },

  async searchUsers(query: string): Promise<SearchUser[]> {
    const token = await TokenService.get();
    if (!query.trim()) return [];
    return api.get<SearchUser[]>(`/users/search?q=${encodeURIComponent(query)}`, token ?? undefined);
  },
};
