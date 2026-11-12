import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/projectService";

interface ProjectPayload {
  name: string;
  description?: string;
  color?: string;
}

export function useProjects(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["projects", workspaceId];
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const query = useQuery({
    queryKey,
    queryFn: () => projectService.list(workspaceId!),
    enabled: !!workspaceId,
  });

  const create = useMutation({
    mutationFn: (payload: ProjectPayload) => projectService.create(workspaceId!, payload),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProjectPayload }) => projectService.update(id, payload),
    onSuccess: refresh,
  });
  const archive = useMutation({ mutationFn: (id: string) => projectService.archive(id), onSuccess: refresh });
  const restore = useMutation({ mutationFn: (id: string) => projectService.restore(id), onSuccess: refresh });

  return {
    ...query,
    projects: query.data ?? [],
    createProject: create.mutateAsync,
    isCreating: create.isPending,
    updateProject: update.mutateAsync,
    isUpdating: update.isPending,
    archiveProject: archive.mutateAsync,
    restoreProject: restore.mutateAsync,
  };
}
