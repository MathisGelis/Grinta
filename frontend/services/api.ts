import { getStrings } from "@/i18n/current";
const DEV_API = "https://grinta-backend.duckdns.org";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API;

const HEALTH_TIMEOUT_MS = 4000;

export async function checkServerHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}/`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  endpoint: string,
  method: HttpMethod,
  body?: any,
  token?: string
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.warn(
      `API unreachable (${BASE_URL}${endpoint}):`,
      error instanceof Error ? error.message : String(error),
    );
    throw new Error(getStrings().apiUnreachable);
  }

  const rawText = await response.text();
  let data: any = undefined;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    if (response.status >= 500 && !(await checkServerHealth())) {
      throw new Error(getStrings().apiUnreachable);
    }
    const raw = data?.message ?? data?.error ?? data;
    const msg = Array.isArray(raw)
      ? raw[0]
      : typeof raw === "string"
      ? raw
      : typeof raw === "object" && raw !== null
      ? (typeof raw.message === "string" ? raw.message : raw.error ?? data?.error ?? getStrings().serverError)
      : data?.error ?? getStrings().serverError;
    throw new Error(msg || `${getStrings().serverError} ${response.status}`);
  }

  return data as T;
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
