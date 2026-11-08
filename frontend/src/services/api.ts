import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import type { AuthResponse } from "../types/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
  // Include credentials (cookies) for cross-origin requests
  withCredentials: false,
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

    // Handle 403 — token present but no permission, or no token at all in dev mode
    if (error.response?.status === 403) {
      console.warn(
        `[API] 403 Forbidden on ${original?.url}. ` +
        `This usually means: no JWT token, expired token, or insufficient permissions.`
      );
    }

    return Promise.reject(error);
  }
);
