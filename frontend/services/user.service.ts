import { api } from "./api";
import { TokenService } from "./token.service";

export const UserService = {
  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      uniqueName?: string;
      birthDate?: string;
      height?: number;
      weight?: number;
    }
  ) {
    const token = await TokenService.get();
    return api.patch<void>(`/users/${userId}`, data, token ?? undefined);
  },
};
