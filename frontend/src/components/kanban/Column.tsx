import { useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "../../types/task";

export function Column({ status, title, color, accent, headerBg, tasks, totalCount, readOnly = false, onSelectTask, onCreateTask }: {
  status: TaskStatus; title: string; color: string; accent: string; headerBg: string;
  tasks: Task[]; totalCount: number; readOnly?: boolean;
  onSelectTask: (id: string) => void; onCreateTask: (title: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [composing, setComposing] = useState(false);

  const submit = (title: string) => {
    if (title.trim()) onCreateTask(title.trim());
    setComposing(false);
  };

  return (
    <div ref={setNodeRef}
      className={`flex w-[288px] shrink-0 flex-col max-h-[calc(100vh-180px)] rounded-2xl border-2 border-t-4 transition-all duration-200 ${accent} ${
        isOver ? "border-primary/40 bg-primary-light/30 shadow-glow" : "border-border bg-canvas"
      }`}>

      {/* Header */}
      <div className={`flex items-center justify-between rounded-t-xl px-3.5 py-3 ${headerBg}`}>
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="text-xs font-bold" style={{ color }}>{title}</span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-muted shadow-sm">{tasks.length === totalCount ? totalCount : `${tasks.length}/${totalCount}`}</span>
        </div>
        {!readOnly && <button onClick={() => setComposing(true)} aria-label={`Add task to ${title}`}
          className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-white/60"
          title="Add task">
          <Plus size={13} style={{ color }} />
        </button>}
      </div>

      {/* Task list */}
      <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2.5">
        <AnimatePresence>
          {composing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <TaskComposer onSubmit={submit} onCancel={() => setComposing(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} readOnly={readOnly} onClick={() => onSelectTask(task.id)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !composing && !readOnly && totalCount === 0 && (
          <button onClick={() => setComposing(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-7 text-xs text-muted transition-colors hover:border-primary/30 hover:text-primary">
            <Plus size={14} /> Add a task
          </button>
        )}
        {tasks.length === 0 && totalCount > 0 && (
          <p className="py-6 text-center text-xs text-muted">No tasks match your filters</p>
        )}
      </div>
    </div>
  );
}

/** The "new task" box. It owns its draft, so the instance that is animating out can never share text with a new one. */
function TaskComposer({ onSubmit, onCancel }: { onSubmit: (title: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState("");
  const done = useRef(false);

  const submit = () => {
    if (done.current) return; // Enter + button click, or a double Enter, must create only one task
    done.current = true;
    onSubmit(draft);
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-card">
      <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={200}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Task title…" rows={2} aria-label="Task title"
        className="w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
      <div className="mt-2 flex justify-end gap-1.5 border-t border-border pt-2">
        <button onClick={onCancel} aria-label="Cancel" className="btn-ghost px-2 py-1 text-xs"><X size={12} /></button>
        <button onClick={submit} className="btn-primary px-3 py-1 text-xs">Add task</button>
      </div>
    </div>
  );
}
