import { useSyncExternalStore } from "react";
import type { User } from "../types/auth";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (accessToken: string, refreshToken: string, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

const STORAGE_KEY = "realtimecollab-auth";

function readInitialState(): Omit<AuthState, "setSession" | "setAccessToken" | "clearSession"> {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, user: null, isAuthenticated: false };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { accessToken: null, refreshToken: null, user: null, isAuthenticated: false };
    }

    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
      isAuthenticated: Boolean(parsed.isAuthenticated),
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null, isAuthenticated: false };
  }
}

const listeners = new Set<() => void>();

let state: AuthState = {
  ...readInitialState(),
  setSession: (accessToken, refreshToken, user) => {
    state = { ...state, accessToken, refreshToken, user, isAuthenticated: true };
    persistState();
    emit();
  },
  setAccessToken: (accessToken) => {
    state = { ...state, accessToken };
    persistState();
    emit();
  },
  clearSession: () => {
    state = {
      ...state,
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    };
    persistState();
    emit();
  },
};

function persistState() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    })
  );
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type UseAuthStore = {
  (): AuthState;
  <T>(selector: (state: AuthState) => T): T;
  getState: () => AuthState;
  setSession: (accessToken: string, refreshToken: string, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore: UseAuthStore = Object.assign(
  function <T>(selector?: (state: AuthState) => T) {
    const value = useSyncExternalStore(subscribe, () => state, () => state);
    return selector ? selector(value) : value;
  },
  {
    getState: () => state,
    setSession: (accessToken: string, refreshToken: string, user: User) => {
      state = { ...state, accessToken, refreshToken, user, isAuthenticated: true };
      persistState();
      emit();
    },
    setAccessToken: (accessToken: string) => {
      state = { ...state, accessToken };
      persistState();
      emit();
    },
    clearSession: () => {
      state = {
        ...state,
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      };
      persistState();
      emit();
    },
  }
) as UseAuthStore;

export const useAuthStoreValue = () => useSyncExternalStore(subscribe, () => state, () => state);

export const setAuthStoreState = (nextState: Partial<AuthState>) => {
  state = { ...state, ...nextState };
  persistState();
  emit();
};

export const authStore = state;
export const selectAuthState = <T>(selector: (state: AuthState) => T) => selector(state);
