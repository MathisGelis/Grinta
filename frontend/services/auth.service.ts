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
    const user = await api.post<{ id: string }>("/users/register", {
      email,
      password,
      name,
    });

    const auth = await api.post<LoginResponse>("/auth/login", { email, password });

    return { access_token: auth.access_token, id: user.id };
  },
};
