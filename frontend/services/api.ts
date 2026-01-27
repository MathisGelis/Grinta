const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

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
    throw new Error(data.message || "Erreur serveur");
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

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, "DELETE", undefined, token),
};
