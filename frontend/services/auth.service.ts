import { api } from "./api";
import { buildUniqueName } from "@/utils/validation";

interface LoginResponse {
  access_token: string;
}

interface RegisterResponse {
  access_token: string;
  id: string;
}

export const AuthService = {
  login(identifier: string, password: string) {
    return api.post<LoginResponse>("/auth/login", { identifier, password });
  },

  async register(email: string, password: string, name: string): Promise<RegisterResponse> {
    const user = await api.post<{ id: string }>("/users/register", {
      email: email.trim(),
      password,
      displayName: name.trim(),
      uniqueName: buildUniqueName(name, email),
    });

    const auth = await api.post<LoginResponse>("/auth/login", { identifier: email.trim(), password });

    return { access_token: auth.access_token, id: user.id };
  },
};
