import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Archive, ChevronRight } from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useBoardSocket } from "../hooks/useBoardSocket";
import { useUiStore } from "../store/uiStore";
import { Board } from "../components/kanban/Board";
import { TaskDetailDrawer } from "../components/TaskDetailDrawer";
import type { TaskStatus } from "../types/task";

const PROJECT_COLORS = [
  "#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6",
];

export default function BoardPage() {
  const { workspaceId } = useParams();
  const { projects, createProject, isLoading: loadingProjects } = useProjects(workspaceId);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const { openTask } = useUiStore();

  useEffect(() => {
    if (!activeProjectId && projects.length > 0) setActiveProjectId(projects[0].id);
  }, [projects, activeProjectId]);

  const { tasks, createTask, moveTask } = useTasks(activeProjectId ?? undefined);
  useBoardSocket(activeProjectId ?? undefined);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const submitProject = async () => {
    if (!projectName.trim()) return;
    const project = await createProject({ name: projectName.trim() });
    setActiveProjectId(project.id);
    setProjectName("");
    setShowNewProject(false);
  };

  const handleCreateTask = (status: TaskStatus, title: string) => {
    createTask({ title }).then((task) => {
      if (task.status !== status) moveTask({ taskId: task.id, status, position: 0 });
    });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Project sidebar ── */}
      <div className="flex w-52 shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Projects</span>
            <button onClick={() => setShowNewProject((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-primary">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showNewProject && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-border">
              <div className="space-y-2 px-3 py-3">
                <input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitProject(); if (e.key === "Escape") setShowNewProject(false); }}
                  placeholder="Project name…" className="input py-1.5 text-xs" />
                <div className="flex gap-1.5">
                  <button onClick={submitProject} className="btn-primary py-1 px-2.5 text-xs">Create</button>
                  <button onClick={() => setShowNewProject(false)} className="btn-ghost py-1 px-2 text-xs"><X size={12} /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {loadingProjects
            ? [...Array(3)].map((_, i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-hover-bg" />)
            : projects.length === 0
              ? <p className="py-6 text-center text-xs text-muted">No projects yet</p>
              : projects.map((p, i) => (
                  <button key={p.id} onClick={() => setActiveProjectId(p.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                      activeProjectId === p.id
                        ? "bg-primary-light font-semibold text-primary"
                        : "text-ink-2 hover:bg-hover-bg hover:text-ink"
                    }`}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color || PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.status === "ARCHIVED" && <Archive size={10} className="shrink-0 text-muted" />}
                  </button>
                ))
          }
        </div>
      </div>

      {/* ── Board area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Board header */}
        {activeProject && (
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: activeProject.color || "#6366F1" }} />
            <h2 className="font-display font-semibold text-ink">{activeProject.name}</h2>
            <div className="ml-auto flex items-center gap-1 text-xs text-muted">
              <span className="rounded-lg bg-hover-bg px-2 py-0.5 font-medium">{tasks.length} tasks</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-5">
          {activeProjectId ? (
            <Board tasks={tasks} onSelectTask={openTask} onCreateTask={handleCreateTask}
              onMoveTask={(id, status, pos) => moveTask({ taskId: id, status, position: pos })} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Plus size={28} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-ink">Create your first project</h3>
              <p className="mt-1 max-w-xs text-sm text-muted">Projects contain tasks organized in Kanban columns</p>
              <button onClick={() => setShowNewProject(true)} className="btn-primary mt-5">
                <Plus size={15} /> New project
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {activeProjectId && <TaskDetailDrawer projectId={activeProjectId} />}
    </div>
  );
}
