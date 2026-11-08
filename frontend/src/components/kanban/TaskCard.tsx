import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Clock, MessageSquare, Flame, ArrowUp, Minus, ChevronDown } from "lucide-react";
import type { Task } from "../../types/task";

const PRIORITY_CONFIG: Record<Task["priority"], { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  URGENT: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: Flame,      label: "Urgent" },
  HIGH:   { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: ArrowUp,    label: "High"   },
  MEDIUM: { color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", icon: Minus,      label: "Medium" },
  LOW:    { color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: ChevronDown, label: "Low"   },
};

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const gradients = [
    "from-violet-500 to-indigo-600",
    "from-cyan-500 to-teal-500",
    "from-emerald-500 to-green-600",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
  ];
  const g = gradients[name.charCodeAt(0) % gradients.length];
  return (
    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${g} text-[9px] font-bold text-white`} title={name}>
      {initials}
    </div>
  );
}

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const p = PRIORITY_CONFIG[task.priority];
  const PIcon = p.icon;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <motion.div ref={setNodeRef} style={style} {...attributes} {...listeners}
      whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(99,102,241,0.12)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group cursor-grab select-none rounded-xl border bg-surface p-3.5 active:cursor-grabbing ${
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
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-hover-bg px-1.5 py-0.5">
              <MessageSquare size={10} /> {task.commentCount}
            </span>
          )}
        </div>
        {task.assignee && <Avatar name={task.assignee.name} />}
      </div>
    </motion.div>
  );
}
