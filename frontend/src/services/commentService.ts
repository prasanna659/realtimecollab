import { api } from "./api";
import type { Comment } from "../types/task";

export const commentService = {
  list: (taskId: string) => api.get<Comment[]>(`/tasks/${taskId}/comments`).then((r) => r.data),
  create: (taskId: string, content: string) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, { content }).then((r) => r.data),
  remove: (commentId: string) => api.delete(`/comments/${commentId}`),
};
