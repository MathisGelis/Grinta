import { api } from "./api";

export interface LoginResponse {
  access_token: string;
}

export interface RegisterResponse {
  access_token: string;
  id: string;
  email: string;
  password: string;
  name: string;
  birthDate: string;
  height: number;
  weight: number;
  createdAt: string;
}

export const AuthService = {
  login(email: string, password: string) {
    return api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
  },

  register(email: string, password: string, name: string) {
    return api.post<RegisterResponse>("/auth/register", {
      email,
      password,
      name,
    });
  },
};
