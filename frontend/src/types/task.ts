import type { User } from "./auth";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  assignee: User | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardEvent {
  type: "TASK_CREATED" | "TASK_UPDATED" | "TASK_MOVED" | "TASK_DELETED" | "COMMENT_ADDED";
  projectId: string;
  taskId: string;
  payload: unknown;
  actorId: string;
  actorName: string;
}
