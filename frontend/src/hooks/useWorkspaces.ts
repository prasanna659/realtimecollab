import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/Toast";
import { workspaceService } from "../services/workspaceService";

export function useWorkspaces() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: workspaceService.list,
  });

  const create = useMutation({
    mutationFn: (name: string) => workspaceService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      push("Workspace created", "success");
    },
    onError: () => {
      push("Could not create the workspace", "error");
    },
  });

  return { ...query, workspaces: query.data ?? [], createWorkspace: create.mutateAsync, isCreating: create.isPending };
}
