import { api } from "./api";
import type { Workspace, WorkspaceMember } from "../types/workspace";

export const workspaceService = {
  list: () => api.get<Workspace[]>("/workspaces").then((r) => r.data),
  create: (name: string) => api.post<Workspace>("/workspaces", { name }).then((r) => r.data),
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`).then((r) => r.data),
  members: (id: string) => api.get<WorkspaceMember[]>(`/workspaces/${id}/members`).then((r) => r.data),
  invite: (id: string, email: string) =>
    api.post<WorkspaceMember>(`/workspaces/${id}/members`, { email }).then((r) => r.data),
  removeMember: (id: string, userId: string) => api.delete(`/workspaces/${id}/members/${userId}`),
  leave: (id: string) => api.post(`/workspaces/${id}/leave`),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
};
