/**
 * WorkspacesPage Component - Main Dashboard
 * 
 * Serves as the primary dashboard after user login.
 * Displays all available workspaces and allows users to:
 * - View all their workspaces
 * - Create new workspaces
 * - Search for workspaces
 * - Access individual workspace details
 * 
 * Features:
 * - Real-time workspace list management
 * - Search/filter functionality
 * - Animated create workspace modal
 * - Workspace count display
 * - Responsive grid layout
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Crown, Search, ArrowRight, Briefcase, X, Sparkles } from "lucide-react";
import { useWorkspaces } from "../hooks/useWorkspaces";

/**
 * Gradient color options for workspace cards
 * Each workspace gets a unique gradient from this palette
 */
const GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-cyan-500 to-teal-500",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

/**
 * WorkspacesPage - Main dashboard component
 * Manages workspace listing, creation, and search functionality
 */
export default function WorkspacesPage() {
  // Hook to manage workspaces state (fetch, create)
  const { workspaces, createWorkspace, isCreating, isLoading } = useWorkspaces();
  
  // UI state
  const [showCreate, setShowCreate] = useState(false);     // Controls create modal visibility
  const [name, setName] = useState("");                      // Input field for new workspace name
  const [search, setSearch] = useState("");                  // Search query for filtering workspaces

  // Filter workspaces based on search query
  const filtered = workspaces.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));

  /**
   * Handler for creating a new workspace
   * - Validates input
   * - Calls createWorkspace API
   * - Resets form state
   * - Closes modal
   */
  const submit = async () => {
    if (!name.trim()) return;
    await createWorkspace(name.trim());
    setName("");
    setShowCreate(false);
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {/* Heading with sparkles icon */}
          <div className="mb-1 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Your workspaces</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">All Workspaces</h1>
          {/* Display count with proper pluralization */}
          <p className="mt-1 text-sm text-muted">{workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""} available</p>
        </div>
        {/* Create new workspace button */}
        <button onClick={() => setShowCreate(true)} className="btn-primary self-start">
          <Plus size={15} /> New workspace
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="mb-6 max-w-sm">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          {/* Real-time search filter */}
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces…" className="input pl-10" />
        </div>
      </div>

      {/* ── Create Workspace Modal ── */}
      <AnimatePresence>
        {showCreate && (
          /* Backdrop - dismissible by clicking outside */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/40 p-4 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}>
            {/* Modal with bounce-in animation */}
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-modal"
              onClick={(e) => e.stopPropagation()}>
              {/* Modal header */}
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">New workspace</h2>
                  <p className="mt-0.5 text-xs text-muted">Give your team a shared home</p>
                </div>
                {/* Close button */}
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5"><X size={16} /></button>
              </div>
              
              {/* Modal form */}
              <div className="space-y-4">
                <div>
                  <label className="label">Workspace name</label>
                  {/* Auto-focus input for better UX, Enter key submits form */}
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="e.g. Product Team" className="input" />
                </div>
                {/* Modal action buttons */}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                  <button onClick={submit} disabled={isCreating || !name.trim()} className="btn-primary">
                    {isCreating ? "Creating…" : "Create workspace"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading Skeleton ── */}
      {/* Shows while fetching workspaces */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse p-5">
              <div className="mb-4 h-11 w-11 rounded-xl bg-hover-bg" />
              <div className="mb-2 h-4 w-2/3 rounded-lg bg-hover-bg" />
              <div className="h-3 w-1/3 rounded-lg bg-hover-bg" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {/* Shown when no workspaces exist or search yields no results */}
      {!isLoading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-primary-light/40 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Briefcase size={24} className="text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-ink">No workspaces yet</h3>
          <p className="mt-1 max-w-xs text-sm text-muted">Create your first workspace to start organizing tasks and collaborating.</p>
          {/* CTA button to create workspace */}
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">
            <Plus size={15} /> Create workspace
          </button>
        </motion.div>
      )}

      {/* ── Workspaces Grid ── */}
      {/* Displays all workspaces in a responsive 2-3 column grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ws, i) => (
            /* Workspace card with staggered animation */
            <motion.div key={ws.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              {/* Link to workspace board */}
              <Link to={`/workspaces/${ws.id}/board`}
                className="card group block overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/20">
                {/* Top color stripe - unique gradient per workspace */}
                <div className={`h-1 w-full bg-gradient-to-r ${GRADIENTS[i % GRADIENTS.length]}`} />
                
                <div className="p-5">
                  {/* Header: Workspace avatar and navigation arrow */}
                  <div className="mb-4 flex items-start justify-between">
                    {/* Avatar with workspace initials */}
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} font-display text-sm font-bold text-white shadow-sm`}>
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    {/* Arrow icon - visible on hover */}
                    <div className="rounded-lg p-1.5 text-muted transition-colors group-hover:text-primary">
                      <ArrowRight size={15} />
                    </div>
                  </div>
                  
                  {/* Workspace name */}
                  <h3 className="font-display truncate text-base font-semibold text-ink">{ws.name}</h3>
                  
                  {/* Workspace metadata: member count and role badge */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                    {/* Member count */}
                    <span className="flex items-center gap-1.5">
                      <Users size={12} /> {ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""}
                    </span>
                    {/* Owner badge - only shown if current user is workspace owner */}
                    {ws.myRole === "OWNER" && (
                      <span className="flex items-center gap-1 font-medium text-warning">
                        <Crown size={11} /> Owner
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
