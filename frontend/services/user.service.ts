import { api } from "./api";
import { TokenService } from "./token.service";

export interface PostPartner {
  id: string;
  uniqueName: string;
  displayName: string;
  avatarThumbnailUrl?: string | null;
}

export interface ProfilePost {
  id: string;
  createdAt: string;
  workoutPhotoThumbnailUrl?: string | null;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  partners?: PostPartner[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  uniqueName: string;
  avatarUrl?: string | null;
  avatarThumbnailUrl?: string | null;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  postsCount: number;
  followStatus: string;
  posts?: ProfilePost[];
  isPrivate: boolean;
}

/**
 * Pour son propre compte : profil complet. Pour un autre utilisateur, seuls
 * `id, displayName, uniqueName, isPublic` et les avatars sont renvoyés.
 */
export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  uniqueName: string;
  createdAt: string;
  isPublic?: boolean;
  avatarUrl?: string | null;
  avatarThumbnailUrl?: string | null;
}

interface UpdateUserData {
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
  avatarThumbnailUrl?: string | null;
}

let myIdCache: { token: string; id: string } | null = null;

export const UserService = {
  async updateProfile(userId: string, data: UpdateUserData) {
    const token = await TokenService.get();
    return api.patch<CurrentUser>(`/users/${userId}`, data, token ?? undefined);
  },

  /** Id de l'utilisateur connecté (une seule requête par token). */
  async getMyId(): Promise<string | null> {
    const token = await TokenService.get();
    if (!token) return null;
    if (myIdCache?.token === token) return myIdCache.id;
    const me = await api.get<{ id: string }>("/auth/me", token);
    myIdCache = { token, id: me.id };
    return me.id;
  },

  async getMe(): Promise<CurrentUser> {
    const token = await TokenService.get();
    const me = await api.get<{ id: string; email: string }>("/auth/me", token ?? undefined);
    const full = await api.get<CurrentUser>(`/users/${me.id}`, token ?? undefined);
    return full;
  },

  async toggleVisibility(): Promise<{ isPublic: boolean }> {
    const token = await TokenService.get();
    return api.patch<{ isPublic: boolean }>("/users/me/toggle-visibility", {}, token ?? undefined);
  },

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
