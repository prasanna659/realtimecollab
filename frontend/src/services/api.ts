import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import type { AuthResponse } from "../types/auth";
import { isExpiringSoon } from "../lib/jwt";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8080/api" : "/api"),
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshInFlight: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const { refreshToken, user, setSession, clearSession } = useAuthStore.getState();
  if (!refreshToken) {
    clearSession();
    throw new Error("No refresh token available");
  }

  const { data } = await axios.post<AuthResponse>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken }
  );

  setSession(data.accessToken, data.refreshToken, data.user ?? user!);
  return data.accessToken;
}

/** Returns a usable access token, refreshing first if it is missing or about to expire. Used by the WebSocket. */
export async function ensureFreshToken(): Promise<string | null> {
  const { accessToken } = useAuthStore.getState();
  if (!isExpiringSoon(accessToken)) return accessToken;
  try {
    refreshInFlight ??= performRefresh().finally(() => {
      refreshInFlight = null;
    });
    return await refreshInFlight;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint = original?.url?.includes("/auth/");

    // Handle 401 — try token refresh once
    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        refreshInFlight ??= performRefresh().finally(() => {
          refreshInFlight = null;
        });
        const newAccessToken = await refreshInFlight;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
