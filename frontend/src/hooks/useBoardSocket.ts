import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import type { BoardEvent, Comment, Task } from "../types/task";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";

/** Subscribes to /topic/projects/{projectId}/board and keeps the tasks query cache in sync live. */
export function useBoardSocket(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      connectHeaders: {
        Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ""}`,
      },
    });

    client.onConnect = () => {
      client.subscribe(`/topic/projects/${projectId}/board`, (message) => {
        const event: BoardEvent = JSON.parse(message.body);
        const queryKey = ["tasks", projectId];

        queryClient.setQueryData<Task[]>(queryKey, (current) => {
          if (!current) return current;

          switch (event.type) {
            case "TASK_CREATED": {
              const task = event.payload as Task;
              if (current.some((t) => t.id === task.id)) return current;
              return [...current, task];
            }
            case "TASK_UPDATED":
            case "TASK_MOVED": {
              const task = event.payload as Task;
              return current.map((t) => (t.id === task.id ? task : t));
            }
            case "TASK_DELETED":
              return current.filter((t) => t.id !== event.taskId);
            default:
              return current;
          }
        });

        if (event.type === "COMMENT_ADDED") {
          const comment = event.payload as Comment;
          const commentsKey = ["comments", event.taskId];
          queryClient.setQueryData<Comment[]>(commentsKey, (current = []) => {
            if (current.some((item) => item.id === comment.id)) return current;
            return [...current, comment];
          });

          queryClient.setQueryData<Task[]>(["tasks", event.projectId], (current = []) => {
            return current.map((task) =>
              task.id === event.taskId ? { ...task, commentCount: task.commentCount + 1 } : task
            );
          });
        }

      });
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [projectId, queryClient]);
}
