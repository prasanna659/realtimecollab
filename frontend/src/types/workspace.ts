export type WorkspaceRole = "OWNER" | "MEMBER";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  myRole: WorkspaceRole;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
}
