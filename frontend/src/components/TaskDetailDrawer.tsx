import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Trash2, Send, Save } from "lucide-react";
import { useUiStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";
import { useTasks } from "../hooks/useTasks";
import { commentService } from "../services/commentService";
import { workspaceService } from "../services/workspaceService";
import { byColumn } from "../lib/boardMath";
import { timeAgo } from "../lib/format";
import { toast } from "../store/toastStore";
import { getErrorMessage } from "../lib/errors";
import { Avatar } from "./Avatar";
import type { Task, TaskPriority, TaskStatus } from "../types/task";

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export function TaskDetailDrawer({ projectId, workspaceId, readOnly = false }: {
  projectId: string;
  workspaceId: string;
  readOnly?: boolean;
}) {
  const selectedTaskId = useUiStore((s) => s.selectedTaskId);
  const closeTask = useUiStore((s) => s.closeTask);
  const { tasks } = useTasks(projectId);
  const task = tasks.find((t) => t.id === selectedTaskId);

  useEffect(() => {
    if (!selectedTaskId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeTask();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTaskId, closeTask]);

  return (
    <AnimatePresence>
      {selectedTaskId && task && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-sidebar/30 backdrop-blur-sm" onClick={closeTask} />
          <motion.aside
            role="dialog" aria-modal="true" aria-label="Task details"
            initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col overflow-hidden border-l border-border bg-surface shadow-modal"
          >
            {/* key resets the form whenever a different task is opened */}
            <TaskEditor key={task.id} task={task} projectId={projectId} workspaceId={workspaceId} readOnly={readOnly} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function TaskEditor({ task, projectId, workspaceId, readOnly }: {
  task: Task; projectId: string; workspaceId: string; readOnly: boolean;
}) {
  const closeTask = useUiStore((s) => s.closeTask);
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { tasks, updateTask, moveTask, removeTask, isUpdating } = useTasks(projectId);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? "");
  const [commentDraft, setCommentDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const members = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService.members(workspaceId),
  });

  const comments = useQuery({
    queryKey: ["comments", task.id],
    queryFn: () => commentService.list(task.id),
  });

  const dirty =
    title.trim() !== task.title ||
    description !== (task.description ?? "") ||
    priority !== task.priority ||
    status !== task.status ||
    dueDate !== (task.dueDate ?? "") ||
    assigneeId !== (task.assignee?.id ?? "");

  const save = async () => {
    if (!title.trim()) {
      toast.error("A task needs a title.");
      return;
    }
    try {
      await updateTask({
        taskId: task.id,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          assigneeId: assigneeId || null,
        },
      });
      if (status !== task.status) {
        // Put it at the bottom of the new column.
        const position = byColumn(tasks, status).length;
        await moveTask({ taskId: task.id, status, position });
      }
      toast.success("Task saved");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save the task."));
    }
  };

  const addComment = useMutation({
    mutationFn: () => commentService.create(task.id, commentDraft.trim()),
    onSuccess: (comment) => {
      setCommentDraft("");
      queryClient.setQueryData<typeof comments.data>(["comments", task.id], (current) =>
        current && !current.some((c) => c.id === comment.id) ? [...current, comment] : current ?? [comment]
      );
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (e) => toast.error(getErrorMessage(e, "Could not post the comment.")),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => commentService.remove(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (e) => toast.error(getErrorMessage(e, "Could not delete the comment.")),
  });

  const remove = async () => {
    try {
      await removeTask(task.id);
      closeTask();
      toast.success("Task deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete the task."));
    }
  };

  const field = "input py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Task details</span>
        <div className="flex items-center gap-1">
          {!readOnly && (
            <button onClick={() => setConfirmDelete(true)} aria-label="Delete task"
              className="btn-ghost p-2 text-sm hover:bg-red-50 hover:text-danger">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={closeTask} aria-label="Close" className="btn-ghost p-2"><X size={16} /></button>
        </div>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="shrink-0 overflow-hidden border-b border-danger/20 bg-danger/5">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium text-danger">Delete this task permanently?</span>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="btn-ghost py-1 text-xs">Cancel</button>
                <button onClick={remove} className="btn-danger px-3 py-1 text-xs">Delete</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {readOnly && (
          <p className="rounded-xl bg-hover-bg px-3 py-2 text-xs text-muted">This project is archived, so tasks are read-only.</p>
        )}

        <div>
          <label className="label" htmlFor="task-title">Title</label>
          <input id="task-title" value={title} maxLength={200} disabled={readOnly}
            onChange={(e) => setTitle(e.target.value)}
            className={`${field} font-display text-base font-semibold`} />
        </div>

        <div>
          <label className="label" htmlFor="task-desc">Description</label>
          <textarea id="task-desc" value={description} rows={4} maxLength={5000} disabled={readOnly}
            onChange={(e) => setDescription(e.target.value)} placeholder="Add more detail…"
            className={`${field} resize-y`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-status">Status</label>
            <select id="task-status" value={status} disabled={readOnly}
              onChange={(e) => setStatus(e.target.value as TaskStatus)} className={field}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-priority">Priority</label>
            <select id="task-priority" value={priority} disabled={readOnly}
              onChange={(e) => setPriority(e.target.value as TaskPriority)} className={field}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-due">Due date</label>
            <input id="task-due" type="date" value={dueDate} disabled={readOnly}
              onChange={(e) => setDueDate(e.target.value)} className={field} />
          </div>
          <div>
            <label className="label" htmlFor="task-assignee">Assignee</label>
            <select id="task-assignee" value={assigneeId} disabled={readOnly}
              onChange={(e) => setAssigneeId(e.target.value)} className={field}>
              <option value="">Unassigned</option>
              {members.data?.map((m) => (
                <option key={m.userId} value={m.userId}>{m.name}{m.userId === me?.id ? " (you)" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end gap-2">
            {dirty && (
              <button onClick={() => {
                setTitle(task.title); setDescription(task.description ?? ""); setPriority(task.priority);
                setStatus(task.status); setDueDate(task.dueDate ?? ""); setAssigneeId(task.assignee?.id ?? "");
              }} className="btn-secondary">Discard</button>
            )}
            <button onClick={save} disabled={!dirty || isUpdating || !title.trim()} className="btn-primary disabled:opacity-40">
              <Save size={14} /> {isUpdating ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2">
              Comments ({comments.data?.length ?? 0})
            </span>
          </div>

          <div className="mb-4 space-y-3">
            {comments.isError && <p className="text-sm text-danger">Could not load comments.</p>}
            {comments.data?.length === 0 && (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">No comments yet</p>
            )}
            {comments.data?.map((c) => (
              <div key={c.id} className="group flex gap-3">
                <Avatar name={c.author.name} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">{c.author.name}</span>
                    <span className="text-[10px] text-muted" title={new Date(c.createdAt).toLocaleString()}>{timeAgo(c.createdAt)}</span>
                    {c.author.id === me?.id && (
                      <button onClick={() => deleteComment.mutate(c.id)} aria-label="Delete comment"
                        className="ml-auto p-0.5 text-muted opacity-0 transition-opacity hover:text-danger focus:opacity-100 group-hover:opacity-100">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words rounded-xl bg-canvas px-3 py-2 text-sm leading-relaxed text-ink-2">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && commentDraft.trim()) {
                  e.preventDefault(); addComment.mutate();
                }
              }}
              placeholder="Write a comment… (Enter to send, Shift+Enter for a new line)" rows={2}
              className="input flex-1 resize-none py-2.5 text-sm" />
            <button onClick={() => commentDraft.trim() && addComment.mutate()}
              disabled={!commentDraft.trim() || addComment.isPending} aria-label="Send comment"
              className="btn-primary self-end p-2.5 disabled:opacity-40">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
