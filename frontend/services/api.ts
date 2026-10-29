import { router } from "expo-router";
import { getStrings } from "@/i18n/current";
import { TokenService } from "./token.service";
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

/** Les photos sont `/uploads/...` ou une URL absolue selon la config du serveur. */
export const mediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  // URI locale (file://, content://…) ou URL absolue : telle quelle.
  return url.startsWith("/") ? `${BASE_URL}${url}` : url;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const isNotFound = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 404;

let redirectingToLogin = false;

async function handleSessionExpired() {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  try {
    await TokenService.remove();
    router.replace("/(auth)/LoginScreen");
  } finally {
    setTimeout(() => {
      redirectingToLogin = false;
    }, 2000);
  }
}

function extractMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const body = data as { message?: unknown; error?: unknown };
  const raw = body.message ?? body.error;
  if (Array.isArray(raw)) return typeof raw[0] === "string" ? raw[0] : undefined;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") return extractMessage(raw);
  return undefined;
}

async function parseResponse<T>(
  response: Response,
  { authenticated, endpoint }: { authenticated: boolean; endpoint: string },
): Promise<T> {
  const rawText = await response.text();
  let data: unknown = undefined;
  let isJson = false;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
      isJson = true;
    } catch {
      data = rawText;
    }
  }

  if (response.ok) return data as T;

  const strings = getStrings();

  if (response.status === 401 && authenticated) {
    void handleSessionExpired();
    throw new ApiError(strings.sessionExpired, 401);
  }
  if (response.status === 429) {
    throw new ApiError(
      endpoint.startsWith("/auth/login")
        ? strings.tooManyAttempts
        : strings.tooManyRequests,
      429,
    );
  }
  if (response.status >= 500 && !(await checkServerHealth())) {
    throw new ApiError(strings.apiUnreachable, response.status);
  }
  if (response.status === 413) throw new ApiError(strings.photoTooHeavy, 413);

  // Une réponse non JSON (ex. page HTML de nginx) devient une erreur générique.
  const message = isJson ? extractMessage(data) : undefined;
  throw new ApiError(message || `${strings.serverError} ${response.status}`, response.status);
}

async function send(
  endpoint: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${endpoint}`, init);
  } catch (error) {
    console.warn(
      `API unreachable (${BASE_URL}${endpoint}):`,
      error instanceof Error ? error.message : String(error),
    );
    throw new Error(getStrings().apiUnreachable);
  }
}

async function request<T>(
  endpoint: string,
  method: HttpMethod,
  body?: any,
  token?: string
): Promise<T> {
  const response = await send(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(response, { authenticated: !!token, endpoint });
}

/**
 * Envoi d'une photo en multipart (un seul fichier, champ `photo`).
 * Ne passe pas par `request` : pas de Content-Type JSON, le boundary est
 * ajouté par `fetch`.
 */
async function upload<T>(endpoint: string, uri: string, token: string): Promise<T> {
  const form = new FormData();
  form.append("photo", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
  const response = await send(endpoint, {
    method: "PUT",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: form,
  });
  return parseResponse<T>(response, { authenticated: true, endpoint });
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

  upload,
};
