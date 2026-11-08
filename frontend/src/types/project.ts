export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  taskCount: number;
  createdAt: string;
}
