import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, MessageSquare, Trash2, Send, Flame, ArrowUp, Minus, ChevronDown } from "lucide-react";
import { useUiStore } from "../store/uiStore";
import { useTasks } from "../hooks/useTasks";
import { commentService } from "../services/commentService";

const PRIORITY_OPTIONS = [
  { value: "URGENT", label: "Urgent", color: "#EF4444", bg: "#FEF2F2", icon: Flame },
  { value: "HIGH",   label: "High",   color: "#F59E0B", bg: "#FFFBEB", icon: ArrowUp },
  { value: "MEDIUM", label: "Medium", color: "#6366F1", bg: "#EEF2FF", icon: Minus },
  { value: "LOW",    label: "Low",    color: "#10B981", bg: "#ECFDF5", icon: ChevronDown },
] as const;

const STATUS_OPTIONS = [
  { value: "TODO",        label: "To Do",       color: "#6366F1", bg: "#EEF2FF" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#06B6D4", bg: "#ECFEFF" },
  { value: "DONE",        label: "Done",        color: "#10B981", bg: "#ECFDF5" },
] as const;

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const gradients = ["from-violet-500 to-indigo-600", "from-cyan-500 to-teal-500", "from-emerald-500 to-green-600", "from-amber-500 to-orange-500"];
  const g = gradients[name.charCodeAt(0) % gradients.length];
  return (
    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${g} text-[10px] font-bold text-white`}>
      {initials}
    </div>
  );
}

export function TaskDetailDrawer({ projectId }: { projectId: string }) {
  const { selectedTaskId, closeTask } = useUiStore();
  const { tasks, removeTask } = useTasks(projectId);
  const queryClient = useQueryClient();
  const [commentDraft, setCommentDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const task = tasks.find((t) => t.id === selectedTaskId);

  const commentsQuery = useQuery({
    queryKey: ["comments", selectedTaskId],
    queryFn: () => commentService.list(selectedTaskId!),
    enabled: !!selectedTaskId,
  });

  const addComment = useMutation({
    mutationFn: () => commentService.create(selectedTaskId!, commentDraft.trim()),
    onSuccess: () => {
      setCommentDraft("");
      queryClient.invalidateQueries({ queryKey: ["comments", selectedTaskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => commentService.remove(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", selectedTaskId] }),
  });

  const priorityInfo = task ? PRIORITY_OPTIONS.find((p) => p.value === task.priority) : null;
  const statusInfo = task ? STATUS_OPTIONS.find((s) => s.value === task.status) : null;

  return (
    <AnimatePresence>
      {selectedTaskId && task && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-sidebar/30 backdrop-blur-sm" onClick={closeTask} />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col overflow-hidden border-l border-border bg-surface shadow-modal"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                {priorityInfo && (
                  <span className="badge text-[10px] font-bold"
                    style={{ background: priorityInfo.bg, color: priorityInfo.color, border: `1px solid ${priorityInfo.color}20` }}>
                    <priorityInfo.icon size={9} /> {priorityInfo.label}
                  </span>
                )}
                {statusInfo && (
                  <span className="badge text-[10px] font-bold"
                    style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}20` }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusInfo.color }} />
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setConfirmDelete(true)} className="btn-ghost p-2 text-sm hover:bg-red-50 hover:text-danger">
                  <Trash2 size={14} />
                </button>
                <button onClick={closeTask} className="btn-ghost p-2"><X size={16} /></button>
              </div>
            </div>

            {/* Confirm delete */}
            <AnimatePresence>
              {confirmDelete && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="shrink-0 overflow-hidden border-b border-danger/20 bg-danger/5">
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium text-danger">Delete this task permanently?</span>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs py-1">Cancel</button>
                      <button onClick={() => { removeTask(task.id); closeTask(); }} className="btn-danger text-xs py-1 px-3">Delete</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* Title & description */}
              <div>
                <h2 className="font-display text-lg font-bold leading-snug text-ink">{task.title}</h2>
                {task.description && <p className="mt-2 text-sm leading-relaxed text-ink-2">{task.description}</p>}
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-canvas p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Status</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: statusInfo?.color }}>
                    <div className="h-2 w-2 rounded-full" style={{ background: statusInfo?.color }} />
                    {statusInfo?.label}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-canvas p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Due date</p>
                  <div className="flex items-center gap-1.5 text-sm text-ink">
                    <Clock size={13} className="text-muted" />
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : <span className="text-muted">Not set</span>
                    }
                  </div>
                </div>
                {task.assignee && (
                  <div className="col-span-2 rounded-xl border border-border bg-canvas p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">Assignee</p>
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assignee.name} />
                      <span className="text-sm font-medium text-ink">{task.assignee.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-2">
                    Comments ({commentsQuery.data?.length ?? 0})
                  </span>
                </div>

                <div className="mb-4 space-y-3">
                  {commentsQuery.data?.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">No comments yet</p>
                  )}
                  {commentsQuery.data?.map((c) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="group flex gap-3">
                      <Avatar name={c.author.name} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink">{c.author.name}</span>
                          <span className="text-[10px] text-muted">
                            {new Date(c.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <button onClick={() => deleteComment.mutate(c.id)}
                            className="ml-auto p-0.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger">
                            <X size={11} />
                          </button>
                        </div>
                        <p className="rounded-xl bg-canvas px-3 py-2 text-sm leading-relaxed text-ink-2">{c.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Comment input */}
                <div className="flex gap-2">
                  <textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && commentDraft.trim()) {
                        e.preventDefault(); addComment.mutate();
                      }
                    }}
                    placeholder="Write a comment… (Enter to send)"
                    rows={2}
                    className="input flex-1 resize-none py-2.5 text-sm" />
                  <button onClick={() => commentDraft.trim() && addComment.mutate()}
                    disabled={!commentDraft.trim()}
                    className="btn-primary self-end p-2.5 disabled:opacity-40">
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
