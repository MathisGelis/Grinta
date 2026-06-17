import { api } from "./api";

export interface LoginResponse {
  access_token: string;
}

export interface RegisterResponse {
  access_token: string;
  id: string;
}

export const AuthService = {
  login(identifier: string, password: string) {
    return api.post<LoginResponse>("/auth/login", { identifier, password });
  },

  async register(email: string, password: string, name: string): Promise<RegisterResponse> {
    const base = name.trim()
      ? name.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "")
      : email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
    const uniqueName = base + Math.floor(Math.random() * 1000);

    const user = await api.post<{ id: string }>("/users/register", {
      email,
      password,
      displayName: name,
      uniqueName,
    });

    const auth = await api.post<LoginResponse>("/auth/login", { identifier: email, password });

    return { access_token: auth.access_token, id: user.id };
  },
};
