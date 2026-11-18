import { File } from "expo-file-system";
import { router } from "expo-router";
import { getCurrentLang, getStrings } from "@/i18n/current";
import { clearUserSession } from "./session.service";
import { queryCache } from "./queryCache";
const DEV_API = "https://grinta-backend.duckdns.org";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API;

/** Adresse du serveur utilisé (sert à ne pas mélanger les caches de deux serveurs). */
export const API_BASE_URL = BASE_URL;

const HEALTH_TIMEOUT_MS = 4000;

export async function checkServerHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}/health`, { signal: controller.signal });
    // 503 = la base de données ne répond pas.
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
  code?: string;
  /** Délai avant de pouvoir réessayer (429), en secondes. */
  retryAfterSeconds?: number;
  /** Erreurs de validation par champ (`errors[].field` → message), 400 uniquement. */
  fieldErrors?: Record<string, string>;
  constructor(
    message: string,
    status: number,
    code?: string,
    retryAfterSeconds?: number,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.fieldErrors = fieldErrors;
  }
}

function formatDelay(seconds: number): string {
  if (seconds < 90) return `${Math.max(1, Math.round(seconds))} s`;
  return `${Math.ceil(seconds / 60)} min`;
}

function extractCode(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const body = data as { code?: unknown; errors?: unknown; message?: unknown };
  if (Array.isArray(body.errors)) {
    const first = body.errors[0] as { code?: unknown } | undefined;
    if (first && typeof first.code === "string") return first.code;
  }
  if (typeof body.code === "string") return body.code;
  if (body.message && typeof body.message === "object") return extractCode(body.message);
  return undefined;
}

/** Messages de validation par champ : le code stable est traduit, sinon le message du serveur. */
function extractFieldErrors(data: unknown, apiErrors: Record<string, string>): Record<string, string> | undefined {
  if (!data || typeof data !== "object") return undefined;
  const list = (data as { errors?: unknown }).errors;
  if (!Array.isArray(list)) return undefined;
  const result: Record<string, string> = {};
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const { field, code, message } = item as { field?: unknown; code?: unknown; message?: unknown };
    if (typeof field !== "string" || field in result) continue;
    const text = (typeof code === "string" && apiErrors[code]) || (typeof message === "string" ? message : "");
    if (text) result[field] = text;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export const isNotFound = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 404;

let redirectingToLogin = false;

async function handleSessionExpired() {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  try {
    await clearUserSession();
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
    const retryAfter = isJson ? (data as { retryAfterSeconds?: unknown }).retryAfterSeconds : undefined;
    const message =
      typeof retryAfter === "number"
        ? strings.retryIn.replace("{time}", formatDelay(retryAfter))
        : endpoint.startsWith("/auth/login")
          ? strings.tooManyAttempts
          : strings.tooManyRequests;
    throw new ApiError(
      message,
      429,
      isJson ? extractCode(data) : undefined,
      typeof retryAfter === "number" ? retryAfter : undefined,
    );
  }
  if (response.status >= 500 && !(await checkServerHealth())) {
    throw new ApiError(strings.apiUnreachable, response.status);
  }
  if (response.status === 413) {
    const isPhoto = /\/(avatar|photo)(\?|$)/.test(endpoint);
    throw new ApiError(isPhoto ? strings.photoTooHeavy : strings.payloadTooLarge, 413);
  }

  // Une réponse non JSON (ex. page HTML de nginx) devient une erreur générique.
  const code = isJson ? extractCode(data) : undefined;
  const message = (code && strings.apiErrors[code]) || (isJson ? extractMessage(data) : undefined);
  throw new ApiError(
    message || `${strings.serverError} ${response.status}`,
    response.status,
    code,
    undefined,
    isJson && response.status === 400 ? extractFieldErrors(data, strings.apiErrors) : undefined,
  );
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
      "Accept-Language": getCurrentLang(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await parseResponse<T>(response, { authenticated: !!token, endpoint });
  // Toute modification de séances, de programmes ou de modèles périme l'onglet Séances.
  if (method !== "GET" && /^\/(programmes|workouts\/(planned|templates|import))/.test(endpoint)) {
    queryCache.invalidate("workouts:");
  }
  return result;
}

/**
 * Envoi d'une photo en multipart (un seul fichier, champ `photo`).
 * Ne passe pas par `request` : pas de Content-Type JSON, le boundary est
 * ajouté par `fetch`.
 */
async function upload<T>(endpoint: string, uri: string, token: string): Promise<T> {
  const form = new FormData();
  // Le fetch d'Expo n'accepte pas `{ uri }` : il faut un `File` (Blob-like).
  form.append("photo", new File(uri) as any);
  const response = await send(endpoint, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Accept-Language": getCurrentLang(),
      Authorization: `Bearer ${token}`,
    },
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
