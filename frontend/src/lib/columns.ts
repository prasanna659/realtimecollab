import type { TaskStatus } from "../types/task";

export const COLUMN_DEFS: { id: TaskStatus; title: string; color: string; accent: string; headerBg: string }[] = [
  { id: "TODO",        title: "To Do",       color: "#6366F1", accent: "border-t-indigo-400",  headerBg: "bg-indigo-50"  },
  { id: "IN_PROGRESS", title: "In Progress", color: "#06B6D4", accent: "border-t-cyan-400",    headerBg: "bg-cyan-50"    },
  { id: "DONE",        title: "Done",        color: "#10B981", accent: "border-t-emerald-400", headerBg: "bg-emerald-50" },
];
