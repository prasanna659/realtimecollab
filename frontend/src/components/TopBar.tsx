import { Link, useParams } from "react-router-dom";
import { Kanban, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useWorkspaces } from "../hooks/useWorkspaces";

export function TopBar() {
  const { user, logout } = useAuth();
  const { workspaceId } = useParams();
  const { workspaces } = useWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-rcborder bg-panel">
      <div className="flex items-center gap-3">
        <Link to="/workspaces" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#D4AF37] to-[#B8860B] text-[#191C28] flex items-center justify-center font-display font-bold text-sm">
            RC
          </div>
          <span className="font-display font-semibold">RealtimeCollab</span>
        </Link>
        {workspace && <span className="text-muted text-sm">/ {workspace.name}</span>}
      </div>

      <div className="flex items-center gap-4">
        {workspaceId && (
          <Link to={`/workspaces/${workspaceId}/board`} className="flex items-center gap-1.5 text-sm text-muted hover:text-white">
            <Kanban size={15} /> Board
          </Link>
        )}
        <span className="text-sm text-muted">{user?.name}</span>
        <button onClick={logout} className="text-muted hover:text-rcrose" title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
