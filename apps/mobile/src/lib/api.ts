import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "@superfinz/shared";

const ACCESS_KEY = "superfinz.access";
const REFRESH_KEY = "superfinz.refresh";
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
let refreshPromise: Promise<string | null> | null = null;

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export function assertApiConfigured() { if (!API_URL) throw new ApiError("Set EXPO_PUBLIC_API_URL in apps/mobile/.env", 0); }
export async function saveTokens(tokens: AuthTokens) { await Promise.all([SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken), SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken)]); }
export async function clearTokens() { await Promise.all([SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY)]); }
export async function getRefreshToken() { return SecureStore.getItemAsync(REFRESH_KEY); }

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken || !API_URL) return null;
    const response = await fetch(`${API_URL}/api/mobile-auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
    if (!response.ok) { await clearTokens(); return null; }
    const tokens = await response.json() as AuthTokens;
    await saveTokens(tokens);
    return tokens.accessToken;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  assertApiConfigured();
  const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers } });
  if (response.status === 401 && retry && await refreshAccessToken()) return apiFetch<T>(path, init, false);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(typeof body?.error === "string" ? body.error : `Request failed (${response.status})`, response.status);
  return body as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  retry = true,
): Promise<T> {
  assertApiConfigured();
  const accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });
  if (response.status === 401 && retry && (await refreshAccessToken()))
    return apiUpload<T>(path, formData, false);
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      typeof body?.error === "string"
        ? body.error
        : `Request failed (${response.status})`,
      response.status,
    );
  return body as T;
}

export async function mobileGoogleLogin(idToken: string, deviceLabel?: string) {
  assertApiConfigured();
  const response = await fetch(`${API_URL}/api/mobile-auth/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, deviceLabel }) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body?.error ?? "Google sign-in failed", response.status);
  await saveTokens(body);
  return body;
}
export async function revokeCurrentSession() {
  const refreshToken = await getRefreshToken();
  if (refreshToken && API_URL) await fetch(`${API_URL}/api/mobile-auth/logout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) }).catch(() => undefined);
  await clearTokens();
}
