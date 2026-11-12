import { api } from "./api";
import type { Project } from "../types/project";

export const projectService = {
  list: (workspaceId: string) =>
    api.get<Project[]>(`/workspaces/${workspaceId}/projects`).then((r) => r.data),
  create: (workspaceId: string, payload: { name: string; description?: string; color?: string }) =>
    api.post<Project>(`/workspaces/${workspaceId}/projects`, payload).then((r) => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  update: (id: string, payload: { name: string; description?: string; color?: string }) =>
    api.put<Project>(`/projects/${id}`, payload).then((r) => r.data),
  archive: (id: string) => api.post<Project>(`/projects/${id}/archive`).then((r) => r.data),
  restore: (id: string) => api.post<Project>(`/projects/${id}/restore`).then((r) => r.data),
};
