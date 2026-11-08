import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const TASKS = [
  { label: "Design system audit",  status: "Done",        statusColor: "text-emerald-400", dotColor: "bg-emerald-400",  barColor: "bg-emerald-500/20" },
  { label: "Frontend redesign",    status: "In Progress", statusColor: "text-violet-400",  dotColor: "bg-violet-400",   barColor: "bg-violet-500/20" },
  { label: "API integration",      status: "In Review",   statusColor: "text-cyan-400",    dotColor: "bg-cyan-400",     barColor: "bg-cyan-500/20" },
  { label: "QA & testing",         status: "To Do",       statusColor: "text-white/30",    dotColor: "bg-white/20",     barColor: "bg-white/5" },
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ── Left panel ── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-[80px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-teal/15 blur-[60px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal font-display text-sm font-bold text-white shadow-glow">
            RC
          </div>
          <span className="font-display text-base font-semibold text-white">RealtimeCollab</span>
        </div>

        {/* Task preview cards */}
        <div className="relative max-w-sm">
          <div className="mb-10 space-y-3">
            {TASKS.map((item, i) => (
              <motion.div key={item.label}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`flex items-center gap-3 rounded-2xl border border-white/8 ${item.barColor} px-4 py-3 backdrop-blur-sm`}
              >
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotColor}`} />
                <span className="flex-1 text-sm text-white/70">{item.label}</span>
                <span className={`text-[11px] font-semibold ${item.statusColor}`}>{item.status}</span>
              </motion.div>
            ))}
          </div>

          <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="font-display mb-3 text-2xl font-bold text-white">
            Where teams move{" "}
            <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
              fast together
            </span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="text-sm leading-relaxed text-white/40">
            Real-time Kanban boards, task tracking, and team collaboration — all in one elegant workspace.
          </motion.p>
        </div>

        {/* Stats row */}
        <div className="relative flex items-center gap-8">
          {["10k+ tasks", "500+ teams", "99.9% uptime"].map(s => (
            <div key={s} className="text-xs font-medium text-white/25">{s}</div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal font-display text-sm font-bold text-white">
              RC
            </div>
            <span className="font-display font-semibold text-ink">RealtimeCollab</span>
          </div>

          <div className="mb-7">
            <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-7 shadow-modal">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
