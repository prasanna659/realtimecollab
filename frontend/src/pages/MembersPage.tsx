import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Crown, Shield, Mail, Trash2, X, Users } from "lucide-react";
import { workspaceService } from "../services/workspaceService";
import { useAuthStore } from "../store/authStore";

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
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${g} text-xs font-bold text-white shadow-sm`}>
      {initials}
    </div>
  );
}

export default function MembersPage() {
  const { workspaceId } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => workspaceService.members(workspaceId!),
    enabled: !!workspaceId,
  });

  const invite = useMutation({
    mutationFn: () => workspaceService.invite(workspaceId!, email.trim()),
    onSuccess: (member) => {
      setInviteMsg({ type: "success", text: `${member.name} added to the workspace` });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
    onError: (err: any) => {
      setInviteMsg({ type: "error", text: err?.response?.data?.message ?? "Could not invite that person" });
    },
  });

  const remove = useMutation({
    mutationFn: (userId: string) => workspaceService.removeMember(workspaceId!, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", workspaceId] }),
  });

  const myRole = members.find((m) => m.userId === currentUser?.id)?.role;
  const isOwner = myRole === "OWNER";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Team members</h1>
          <p className="mt-1 text-sm text-muted">
            {members.length} member{members.length !== 1 ? "s" : ""} · {isOwner ? "Owner" : "Member"}
          </p>
        </div>
        {isOwner && (
          <button onClick={() => { setShowInvite(true); setInviteMsg(null); }} className="btn-primary">
            <UserPlus size={15} /> Invite member
          </button>
        )}
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/40 p-4 backdrop-blur-sm"
            onClick={() => setShowInvite(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-modal"
              onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Invite teammate</h2>
                  <p className="mt-0.5 text-xs text-muted">They must have a RealtimeCollab account.</p>
                </div>
                <button onClick={() => setShowInvite(false)} className="btn-ghost p-1.5"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input autoFocus type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && email.trim() && invite.mutate()}
                      placeholder="colleague@company.com" className="input pl-10" />
                  </div>
                </div>
                {inviteMsg && (
                  <div className={`rounded-xl px-3 py-2.5 text-xs font-medium ${
                    inviteMsg.type === "success"
                      ? "border border-success/20 bg-success/8 text-success"
                      : "border border-danger/20 bg-danger/8 text-danger"
                  }`}>{inviteMsg.text}</div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
                  <button onClick={() => invite.mutate()} disabled={invite.isPending || !email.trim()} className="btn-primary">
                    {invite.isPending ? "Inviting…" : "Send invite"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card flex animate-pulse items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-hover-bg" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded-lg bg-hover-bg" />
                <div className="h-3 w-1/2 rounded-lg bg-hover-bg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && members.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/20 bg-primary-light/30 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Users size={24} className="text-primary" />
          </div>
          <h3 className="font-display font-semibold text-ink">No members yet</h3>
          <p className="mt-1 text-sm text-muted">Invite your teammates to collaborate</p>
        </div>
      )}

      {/* List */}
      {!isLoading && members.length > 0 && (
        <div className="space-y-2">
          {members.map((member, i) => (
            <motion.div key={member.userId}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card group flex items-center gap-3 p-4 transition-shadow hover:shadow-card-hover">
              <Avatar name={member.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{member.name}</span>
                  {member.role === "OWNER" ? (
                    <span className="badge bg-warning/10 text-warning text-[10px] font-bold">
                      <Crown size={9} /> Owner
                    </span>
                  ) : (
                    <span className="badge bg-primary-light text-primary text-[10px] font-bold">
                      <Shield size={9} /> Member
                    </span>
                  )}
                  {member.userId === currentUser?.id && (
                    <span className="badge bg-hover-bg text-muted text-[10px] font-bold">You</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{member.email}</p>
              </div>
              {isOwner && member.userId !== currentUser?.id && member.role !== "OWNER" && (
                <button onClick={() => remove.mutate(member.userId)}
                  className="btn-ghost p-2 text-sm opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
