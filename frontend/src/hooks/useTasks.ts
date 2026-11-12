import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskService, type CreateTaskPayload } from "../services/taskService";
import { applyMove } from "../lib/boardMath";
import type { Task, TaskStatus } from "../types/task";

export function useTasks(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["tasks", projectId];

  const query = useQuery({
    queryKey,
    queryFn: () => taskService.list(projectId!),
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskService.create(projectId!, payload),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(queryKey, (current) => {
        if (!current) return [task];
        // The live event can arrive before this response; never add the same task twice.
        return current.some((t) => t.id === task.id) ? current : [...current, task];
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: CreateTaskPayload }) =>
      taskService.update(taskId, payload),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(queryKey, (current) => current?.map((t) => (t.id === task.id ? task : t)));
    },
  });

  /** Optimistic drag-and-drop: the board updates instantly, then re-syncs with the server's answer. */
  const move = useMutation({
    mutationFn: ({ taskId, status, position }: { taskId: string; status: TaskStatus; position: number }) =>
      taskService.move(taskId, status, position),
    onMutate: async ({ taskId, status, position }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (current) =>
        current ? applyMove(current, taskId, status, position) : current
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    // Moving renumbers neighbours on the server, so always re-sync once the request settles.
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: (taskId: string) => taskService.remove(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.setQueryData<Task[]>(queryKey, (current) => current?.filter((t) => t.id !== taskId));
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    ...query,
    tasks: query.data ?? [],
    createTask: create.mutateAsync,
    updateTask: update.mutateAsync,
    isUpdating: update.isPending,
    moveTask: move.mutateAsync,
    removeTask: remove.mutateAsync,
  };
}
