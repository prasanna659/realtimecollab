import { api } from "./api";
import type { AuthResponse, LoginPayload, RegisterPayload } from "../types/auth";

export const authService = {
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refreshToken }),

  me: () => api.get("/users/me").then((r) => r.data),
};
