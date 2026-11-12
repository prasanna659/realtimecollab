import { useState } from "react";
import { Outlet, NavLink, useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Kanban, Users, LogOut, Menu, ChevronDown, Plus, Briefcase, Zap, WifiOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { useUiStore } from "../store/uiStore";
import { Avatar } from "../components/Avatar";

export function AppLayout() {
  const { workspaceId } = useParams();
  const { user, logout } = useAuth();
  const { workspaces } = useWorkspaces();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceSwitcher, setWorkspaceSwitcher] = useState(false);
  const socketStatus = useUiStore((s) => s.socketStatus);

  const activeWorkspaceId = workspaceId ?? workspaces[0]?.id;
  const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isBoardPage = location.pathname.endsWith("/board");

  const navItems = activeWorkspaceId
    ? [
        { to: `/workspaces/${activeWorkspaceId}/board`,   icon: Kanban,    label: "Board" },
        { to: `/workspaces/${activeWorkspaceId}/members`, icon: Users,     label: "Members" },
      ]
    : [];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="border-b border-white/8 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal shadow-glow text-xs font-bold text-white font-display">
            RC
          </div>
          <span className="font-display text-sm font-semibold text-white tracking-tight">RealtimeCollab</span>
        </div>
      </div>

      {/* Workspace switcher */}
      {workspace && (
        <div className="border-b border-white/8 px-3 py-3">
          <button
            onClick={() => setWorkspaceSwitcher((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/6"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/30 text-[10px] font-bold text-primary-light border border-primary/30">
              {workspace.name[0].toUpperCase()}
            </div>
            <span className="flex-1 truncate text-xs font-medium text-white/80">{workspace.name}</span>
            <ChevronDown size={12} className={`shrink-0 text-white/30 transition-transform ${workspaceSwitcher ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {workspaceSwitcher && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="space-y-0.5 pt-1">
                  {workspaces.map((ws) => (
                    <button key={ws.id}
                      onClick={() => { navigate(`/workspaces/${ws.id}/board`); setWorkspaceSwitcher(false); setSidebarOpen(false); }}
                      className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        ws.id === activeWorkspaceId ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/6 hover:text-white/80"
                      }`}
                    >
                      {ws.name}
                    </button>
                  ))}
                  <button
                    onClick={() => { navigate("/workspaces"); setWorkspaceSwitcher(false); setSidebarOpen(false); }}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs text-white/30 hover:bg-white/6 hover:text-white/60 transition-colors"
                  >
                    <Plus size={10} /> All workspaces
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <NavLink to="/workspaces" className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>
          <Briefcase size={16} /> Workspaces
        </NavLink>

        {navItems.length > 0 && (
          <>
            <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">Workspace</div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? "sidebar-link-active" : "sidebar-link"} onClick={() => setSidebarOpen(false)}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/8 px-3 py-4">
        <div className="group flex cursor-default items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/6">
          {user && <Avatar name={user.name} size="md" />}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-white">{user?.name}</div>
            <div className="truncate text-[10px] text-white/30">{user?.email}</div>
          </div>
          <button onClick={logout} title="Sign out" aria-label="Sign out" className="rounded-lg p-1.5 text-white/40 transition-all hover:bg-white/8 hover:text-white md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 shadow-sidebar md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-sidebar/40 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed left-0 top-0 z-50 h-full w-60 md:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2 md:hidden">
            <Menu size={18} />
          </button>

          {/* Connection badge: reflects the real WebSocket state, only shown on the board where it matters */}
          {isBoardPage && (
            <div role="status" className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 sm:flex ${
              socketStatus === "live" ? "border-primary/20 bg-primary-light text-primary"
              : socketStatus === "offline" ? "border-red-200 bg-red-50 text-red-700"
              : "border-border bg-hover-bg text-muted"
            }`}>
              {socketStatus === "offline" ? <WifiOff size={11} /> : <Zap size={11} />}
              <span className="text-[11px] font-semibold">
                {socketStatus === "live" ? "Live" : socketStatus === "offline" ? "Reconnecting…" : "Connecting…"}
              </span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas px-2.5 py-1.5">
                <Avatar name={user.name} size="md" />
                <span className="hidden text-sm font-medium text-ink sm:block">{user.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-hidden">
          {isBoardPage ? (
            <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
              className="h-full overflow-hidden">
              <Outlet />
            </motion.div>
          ) : (
            <div className="h-full overflow-y-auto">
              <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                className="p-4 sm:p-6">
                <Outlet />
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
