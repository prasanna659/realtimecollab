import { create } from "zustand";

export type SocketStatus = "connecting" | "live" | "offline";

interface UiState {
  selectedTaskId: string | null;
  openTask: (taskId: string) => void;
  closeTask: () => void;
  socketStatus: SocketStatus;
  setSocketStatus: (status: SocketStatus) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedTaskId: null,
  openTask: (taskId) => set({ selectedTaskId: taskId }),
  closeTask: () => set({ selectedTaskId: null }),
  socketStatus: "connecting",
  setSocketStatus: (socketStatus) => set({ socketStatus }),
}));
