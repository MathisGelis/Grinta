import { Platform } from "react-native";

const DEV_API = Platform.OS === "android" ? "http://192.168.31.7:3000" : "http://localhost:3000";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  endpoint: string,
  method: HttpMethod,
  body?: any,
  token?: string
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {

    const raw = data.message;
    const msg = Array.isArray(raw)
      ? raw[0]
      : typeof raw === "string"
      ? raw
      : typeof raw === "object" && raw !== null
      ? (typeof raw.message === "string" ? raw.message : raw.error ?? data.error ?? "Erreur serveur")
      : data.error ?? "Erreur serveur";
    throw new Error(msg);
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, "GET", undefined, token),

  post: <T>(endpoint: string, body?: any, token?: string) =>
    request<T>(endpoint, "POST", body, token),

  put: <T>(endpoint: string, body?: any, token?: string) =>
    request<T>(endpoint, "PUT", body, token),

  patch: <T>(endpoint: string, body?: any, token?: string) =>
    request<T>(endpoint, "PATCH", body, token),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, "DELETE", undefined, token),
};
