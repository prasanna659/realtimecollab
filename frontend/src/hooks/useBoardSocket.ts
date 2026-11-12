import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { ensureFreshToken } from "../services/api";
import { useUiStore } from "../store/uiStore";
import type { BoardEvent, Comment, Task } from "../types/task";

// Dev server talks to the backend directly. Production builds use the page's own host, which nginx proxies to /ws.
const WS_URL =
  import.meta.env.VITE_WS_URL ??
  (import.meta.env.DEV
    ? "ws://localhost:8080/ws"
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`);

/**
 * Subscribes to /topic/projects/{projectId}/board and keeps the React Query cache in sync.
 * Reports its connection state to the UI store so the header badge reflects reality.
 */
export function useBoardSocket(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const setSocketStatus = useUiStore((s) => s.setSocketStatus);

  useEffect(() => {
    if (!projectId) return;

    const tasksKey = ["tasks", projectId];
    let hasConnectedBefore = false;
    setSocketStatus("connecting");

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // Runs before every (re)connect, so a long-lived tab never reconnects with an expired token.
      beforeConnect: async (c) => {
        const token = await ensureFreshToken();
        c.connectHeaders = { Authorization: `Bearer ${token ?? ""}` };
      },
    });

    client.onConnect = () => {
      setSocketStatus("live");
      // Anything that happened while we were offline was missed, so reload once after a reconnect.
      if (hasConnectedBefore) queryClient.invalidateQueries({ queryKey: tasksKey });
      hasConnectedBefore = true;

      client.subscribe(`/topic/projects/${projectId}/board`, (message) => {
        let event: BoardEvent;
        try {
          event = JSON.parse(message.body) as BoardEvent;
        } catch {
          return;
        }

        switch (event.type) {
          case "TASK_CREATED": {
            const task = event.payload as Task;
            queryClient.setQueryData<Task[]>(tasksKey, (current) =>
              !current || current.some((t) => t.id === task.id) ? current : [...current, task]
            );
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            break;
          }
          case "TASK_UPDATED": {
            const task = event.payload as Task;
            queryClient.setQueryData<Task[]>(tasksKey, (current) =>
              current?.map((t) => (t.id === task.id ? task : t))
            );
            break;
          }
          case "TASK_MOVED":
            // A move renumbers other cards too, and the event only carries the moved one: reload.
            queryClient.invalidateQueries({ queryKey: tasksKey });
            break;
          case "TASK_DELETED":
            queryClient.setQueryData<Task[]>(tasksKey, (current) => current?.filter((t) => t.id !== event.taskId));
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            break;
          case "COMMENT_ADDED": {
            const comment = event.payload as Comment;
            queryClient.setQueryData<Comment[]>(["comments", event.taskId], (current) =>
              !current || current.some((c) => c.id === comment.id) ? current : [...current, comment]
            );
            queryClient.setQueryData<Task[]>(tasksKey, (current) =>
              current?.map((t) => (t.id === event.taskId ? { ...t, commentCount: t.commentCount + 1 } : t))
            );
            break;
          }
        }
      });
    };

    client.onWebSocketClose = () => setSocketStatus("offline");
    client.onStompError = () => setSocketStatus("offline");

    client.activate();
    return () => {
      void client.deactivate();
      setSocketStatus("connecting");
    };
  }, [projectId, queryClient, setSocketStatus]);
}
