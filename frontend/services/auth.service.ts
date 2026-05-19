import { api } from "./api";
import { saveItem, removeItem } from "@/core/services/storage";
import { TokenService } from "./token.service";

export interface LoginResponse {
  access_token: string;
}

export interface RegisterResponse {
  access_token: string;
  id: string;
}

interface MeResponse {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  uniqueName: string;
}

export const AuthService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/login", { identifier, password });
    await TokenService.save(res.access_token);
    const me = await api.get<MeResponse>("/auth/me", res.access_token);
    const profile = await api.get<UserProfile>(`/users/${me.id}`, res.access_token);
    await saveItem("user_id", profile.id);
    await saveItem("user_name", profile.displayName || "");
    await saveItem("user_unique_name", profile.uniqueName || "");
    await saveItem("user_email", profile.email || "");
    return res;
  },

  async logout(): Promise<void> {
    await TokenService.remove();
    await removeItem("user_id");
    await removeItem("user_name");
    await removeItem("user_unique_name");
    await removeItem("user_email");
  },

  async register(
    email: string,
    password: string,
    displayName: string,
    uniqueName: string
  ): Promise<RegisterResponse> {
    const user = await api.post<{ id: string }>("/users/register", {
      email,
      password,
      displayName,
      uniqueName,
    });

    const auth = await api.post<LoginResponse>("/auth/login", {
      identifier: email,
      password,
    });

    return { access_token: auth.access_token, id: user.id };
  },
};
