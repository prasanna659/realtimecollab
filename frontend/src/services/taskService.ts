import { api } from "./api";
import type { Task, TaskStatus, TaskPriority } from "../types/task";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

export const taskService = {
  list: (projectId: string) => api.get<Task[]>(`/projects/${projectId}/tasks`).then((r) => r.data),
  create: (projectId: string, payload: CreateTaskPayload) =>
    api.post<Task>(`/projects/${projectId}/tasks`, payload).then((r) => r.data),
  update: (taskId: string, payload: CreateTaskPayload) =>
    api.put<Task>(`/tasks/${taskId}`, payload).then((r) => r.data),
  move: (taskId: string, status: TaskStatus, position: number) =>
    api.patch<Task>(`/tasks/${taskId}/move`, { status, position }).then((r) => r.data),
  remove: (taskId: string) => api.delete(`/tasks/${taskId}`),
};
