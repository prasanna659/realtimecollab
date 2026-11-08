import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/projectService";

export function useProjects(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => projectService.list(workspaceId!),
    enabled: !!workspaceId,
  });

  const create = useMutation({
    mutationFn: (payload: { name: string; description?: string; color?: string }) =>
      projectService.create(workspaceId!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] }),
  });

  return { ...query, projects: query.data ?? [], createProject: create.mutateAsync, isCreating: create.isPending };
}
