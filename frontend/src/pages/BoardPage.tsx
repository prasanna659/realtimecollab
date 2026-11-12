import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Archive, ArchiveRestore, Pencil, Search, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useBoardSocket } from "../hooks/useBoardSocket";
import { useUiStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";
import { Board } from "../components/kanban/Board";
import { TaskDetailDrawer } from "../components/TaskDetailDrawer";
import { toast } from "../store/toastStore";
import { getErrorMessage } from "../lib/errors";
import type { Project } from "../types/project";
import type { Task, TaskPriority, TaskStatus } from "../types/task";

const PROJECT_COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

export default function BoardPage() {
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const me = useAuthStore((s) => s.user);
  const { openTask, closeTask } = useUiStore();

  const {
    projects, isLoading: loadingProjects, isError: projectsFailed, refetch: refetchProjects,
    createProject, updateProject, archiveProject, restoreProject, isCreating, isUpdating,
  } = useProjects(workspaceId);

  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; project: Project } | null>(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "ALL">("ALL");
  const [mineOnly, setMineOnly] = useState(false);

  const visibleProjects = useMemo(
    () => projects.filter((p) => showArchived || p.status === "ACTIVE"),
    [projects, showArchived]
  );

  // The selected project lives in the URL (?project=...) so a board link can be shared and survives reloads.
  const requestedId = searchParams.get("project");
  const activeProject =
    projects.find((p) => p.id === requestedId) ?? visibleProjects[0] ?? undefined;
  const activeProjectId = activeProject?.id;
  const archived = activeProject?.status === "ARCHIVED";

  const selectProject = (id: string) => {
    closeTask();
    setSearchParams({ project: id }, { replace: true });
  };

  // Leaving the page must not leave a drawer open for a task of another project.
  useEffect(() => () => closeTask(), [closeTask]);

  const { tasks, isLoading: loadingTasks, isError: tasksFailed, refetch: refetchTasks, createTask, moveTask } =
    useTasks(activeProjectId);
  useBoardSocket(activeProjectId);

  const filtersActive = query.trim() !== "" || priority !== "ALL" || mineOnly;
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (t: Task) =>
      (!q || t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)) &&
      (priority === "ALL" || t.priority === priority) &&
      (!mineOnly || t.assignee?.id === me?.id);
  }, [query, priority, mineOnly, me?.id]);

  const done = tasks.filter((t) => t.status === "DONE").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const handleCreateTask = async (status: TaskStatus, title: string) => {
    try {
      await createTask({ title, status });
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not create the task."));
    }
  };

  const handleMove = async (taskId: string, status: TaskStatus, position: number) => {
    try {
      await moveTask({ taskId, status, position });
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not move the task. It was put back."));
    }
  };

  const toggleArchive = async (project: Project) => {
    try {
      if (project.status === "ACTIVE") {
        await archiveProject(project.id);
        toast.success(`“${project.name}” archived`);
      } else {
        await restoreProject(project.id);
        toast.success(`“${project.name}” restored`);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (!workspaceId) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      {/* ── Project list (sidebar on desktop) ── */}
      <div className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Projects</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setShowArchived((v) => !v)} aria-pressed={showArchived}
              title={showArchived ? "Hide archived projects" : "Show archived projects"}
              aria-label={showArchived ? "Hide archived projects" : "Show archived projects"}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover-bg hover:text-ink">
              {showArchived ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => setModal({ mode: "create" })} aria-label="New project" title="New project"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {loadingProjects ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-hover-bg" />)
          ) : projectsFailed ? (
            <button onClick={() => refetchProjects()} className="btn-ghost w-full text-xs"><RefreshCw size={12} /> Retry</button>
          ) : visibleProjects.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">No projects yet</p>
          ) : (
            visibleProjects.map((p, i) => (
              <button key={p.id} onClick={() => selectProject(p.id)} aria-current={activeProjectId === p.id}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                  activeProjectId === p.id ? "bg-primary-light font-semibold text-primary" : "text-ink-2 hover:bg-hover-bg hover:text-ink"
                }`}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color || PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
                <span className="flex-1 truncate">{p.name}</span>
                {p.status === "ARCHIVED" ? <Archive size={10} className="shrink-0 text-muted" /> : (
                  <span className="text-[10px] text-muted">{p.taskCount}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Project picker (mobile) ── */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2 md:hidden">
        <select value={activeProjectId ?? ""} onChange={(e) => selectProject(e.target.value)}
          aria-label="Project" className="input flex-1 py-1.5 text-sm" disabled={visibleProjects.length === 0}>
          {visibleProjects.length === 0 && <option value="">No projects</option>}
          {visibleProjects.map((p) => <option key={p.id} value={p.id}>{p.name}{p.status === "ARCHIVED" ? " (archived)" : ""}</option>)}
        </select>
        <button onClick={() => setModal({ mode: "create" })} aria-label="New project" className="btn-primary p-2"><Plus size={16} /></button>
      </div>

      {/* ── Board area ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {activeProject && (
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface px-4 py-3 sm:px-5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: activeProject.color || "#6366F1" }} />
            <h2 className="font-display font-semibold text-ink">{activeProject.name}</h2>

            <div className="hidden items-center gap-2 text-xs text-muted sm:flex" title={`${done} of ${tasks.length} tasks done`}>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-hover-bg">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="font-medium">{progress}% done</span>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…"
                  aria-label="Search tasks" className="input w-40 py-1.5 pl-8 text-xs sm:w-48" />
              </div>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | "ALL")}
                aria-label="Filter by priority" className="input w-auto py-1.5 text-xs">
                <option value="ALL">All priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <button onClick={() => setMineOnly((v) => !v)} aria-pressed={mineOnly}
                className={`rounded-btn border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  mineOnly ? "border-primary bg-primary-light text-primary" : "border-border bg-surface text-ink-2 hover:bg-hover-bg"
                }`}>
                My tasks
              </button>
              {filtersActive && (
                <button onClick={() => { setQuery(""); setPriority("ALL"); setMineOnly(false); }} className="btn-ghost px-2 py-1 text-xs">
                  <X size={12} /> Clear
                </button>
              )}
              <span className="rounded-lg bg-hover-bg px-2 py-1 text-xs font-medium text-muted">{tasks.length} tasks</span>
              <button onClick={() => setModal({ mode: "edit", project: activeProject })} aria-label="Rename project" title="Edit project"
                className="btn-ghost p-1.5"><Pencil size={14} /></button>
              <button onClick={() => toggleArchive(activeProject)} aria-label={archived ? "Restore project" : "Archive project"}
                title={archived ? "Restore project" : "Archive project"} className="btn-ghost p-1.5">
                {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              </button>
            </div>
          </div>
        )}

        {archived && (
          <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-900">
            <Archive size={13} /> This project is archived and read-only.
            <button onClick={() => toggleArchive(activeProject!)} className="ml-auto font-semibold underline">Restore</button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-5">
          {projectsFailed ? (
            <ErrorState message="Could not load projects." onRetry={() => refetchProjects()} />
          ) : loadingProjects ? (
            <BoardSkeleton />
          ) : !activeProjectId ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Plus size={28} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-ink">Create your first project</h3>
              <p className="mt-1 max-w-xs text-sm text-muted">Projects hold tasks organised in To Do, In Progress and Done columns.</p>
              <button onClick={() => setModal({ mode: "create" })} className="btn-primary mt-5"><Plus size={15} /> New project</button>
            </motion.div>
          ) : tasksFailed ? (
            <ErrorState message="Could not load tasks." onRetry={() => refetchTasks()} />
          ) : loadingTasks ? (
            <BoardSkeleton />
          ) : (
            <Board tasks={tasks} matches={matches} readOnly={archived} onSelectTask={openTask}
              onCreateTask={handleCreateTask} onMoveTask={handleMove} />
          )}
        </div>
      </div>

      {activeProjectId && <TaskDetailDrawer projectId={activeProjectId} workspaceId={workspaceId} readOnly={archived} />}

      <AnimatePresence>
        {modal && (
          <ProjectModal
            key={modal.mode === "edit" ? modal.project.id : "create"}
            project={modal.mode === "edit" ? modal.project : undefined}
            busy={isCreating || isUpdating}
            onClose={() => setModal(null)}
            onSubmit={async (name, color) => {
              try {
                if (modal.mode === "edit") {
                  await updateProject({ id: modal.project.id, payload: { name, color, description: modal.project.description ?? undefined } });
                  toast.success("Project updated");
                } else {
                  const project = await createProject({ name, color });
                  selectProject(project.id);
                  toast.success("Project created");
                }
                setModal(null);
              } catch (e) {
                toast.error(getErrorMessage(e, "Could not save the project."));
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectModal({ project, busy, onClose, onSubmit }: {
  project?: Project; busy: boolean; onClose: () => void; onSubmit: (name: string, color: string) => void;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0]);
  const valid = name.trim().length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={project ? "Edit project" : "New project"}
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">{project ? "Edit project" : "New project"}</h2>
          <button onClick={onClose} aria-label="Close" className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="project-name">Project name</label>
            <input id="project-name" autoFocus value={name} maxLength={120} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && valid && !busy && onSubmit(name.trim(), color)}
              placeholder="e.g. Website redesign" className="input" />
          </div>
          <div>
            <span className="label">Colour</span>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c}
                  className={`h-7 w-7 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-offset-2 ring-primary" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={() => onSubmit(name.trim(), color)} disabled={!valid || busy} className="btn-primary">
              {busy ? "Saving…" : project ? "Save" : "Create project"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <AlertTriangle size={28} className="text-danger" />
      <p className="mt-3 text-sm font-medium text-ink">{message}</p>
      <button onClick={onRetry} className="btn-secondary mt-4"><RefreshCw size={14} /> Try again</button>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex h-full gap-4" aria-busy="true" aria-label="Loading board">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-[288px] shrink-0 animate-pulse space-y-2 rounded-2xl border-2 border-border bg-canvas p-3">
          <div className="h-8 rounded-xl bg-hover-bg" />
          <div className="h-20 rounded-xl bg-hover-bg" />
          <div className="h-20 rounded-xl bg-hover-bg" />
        </div>
      ))}
    </div>
  );
}
