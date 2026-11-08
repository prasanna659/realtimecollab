import { useSyncExternalStore } from "react";

export interface UiState {
  selectedTaskId: string | null;
  openTask: (taskId: string) => void;
  closeTask: () => void;
}

const listeners = new Set<() => void>();

let state: UiState = {
  selectedTaskId: null,
  openTask: (taskId) => {
    state = { ...state, selectedTaskId: taskId };
    emit();
  },
  closeTask: () => {
    state = { ...state, selectedTaskId: null };
    emit();
  },
};

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUiStore(): UiState;
export function useUiStore<T>(selector: (state: UiState) => T): T;
export function useUiStore<T>(selector?: (state: UiState) => T) {
  const value = useSyncExternalStore(subscribe, () => state, () => state);
  return selector ? selector(value) : value;
}

export const uiStore = state;
export const useUiStoreValue = () => useSyncExternalStore(subscribe, () => state, () => state);
