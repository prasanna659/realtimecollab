import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Clock, MessageSquare, Flame, ArrowUp, Minus, ChevronDown } from "lucide-react";
import { Avatar } from "../Avatar";
import { formatDueDate, isOverdue as checkOverdue } from "../../lib/format";
import type { Task } from "../../types/task";

const PRIORITY_CONFIG: Record<Task["priority"], { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  URGENT: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: Flame,      label: "Urgent" },
  HIGH:   { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: ArrowUp,    label: "High"   },
  MEDIUM: { color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", icon: Minus,      label: "Medium" },
  LOW:    { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: ChevronDown, label: "Low"   },
};

export function TaskCard({ task, onClick, readOnly = false }: { task: Task; onClick: () => void; readOnly?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: readOnly });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const p = PRIORITY_CONFIG[task.priority];
  const PIcon = p.icon;
  const isOverdue = checkOverdue(task.dueDate, task.status === "DONE");

  return (
    <motion.div ref={setNodeRef} style={style} {...attributes} {...listeners}
      whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(99,102,241,0.12)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={`${task.title}, ${p.label} priority`}
      className={`group ${readOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} select-none rounded-xl border bg-surface p-3.5 ${
        isDragging ? "opacity-40 shadow-modal" : "shadow-card"
      } ${isOverdue ? "border-danger/30" : "border-border"}`}>

      {/* Priority badge */}
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
          <PIcon size={8} /> {p.label}
        </span>
      </div>

      {/* Title */}
      <p className="mb-3 line-clamp-2 text-sm font-medium leading-snug text-ink">{task.title}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[11px] text-muted">
          {task.dueDate && (
            <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 ${isOverdue ? "bg-danger/8 text-danger font-medium" : "bg-hover-bg"}`}>
              <Clock size={10} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-hover-bg px-1.5 py-0.5">
              <MessageSquare size={10} /> {task.commentCount}
            </span>
          )}
        </div>
        {task.assignee && <Avatar name={task.assignee.name} size="xs" />}
      </div>
    </motion.div>
  );
}
