"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import { hasPermission } from "@/lib/rbac";
import { Users, UserPlus, Shield, Trash2, ShieldAlert, Loader2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  status: "ACTIVE" | "PENDING";
}

export default function TeamPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role?.toUpperCase() || "VIEWER";

  const canViewTeam = hasPermission(userRole, "team:view") || hasPermission(userRole, "users:manage");
  const canInvite = hasPermission(userRole, "users:invite");
  const canManageRoles = hasPermission(userRole, "users:manage");

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "ANALYST" | "VIEWER">("ANALYST");

  useEffect(() => {
    if (!canViewTeam) {
      setLoading(false);
      return;
    }

    fetch("/api/members")
      .then((res) => (res.ok ? res.json() : null))
      .then((apiMembers) => {
        if (Array.isArray(apiMembers)) {
          const mapped = apiMembers.map((m: { id: string; role: string; user: { name?: string; email: string } }) => ({
            id: m.id,
            name: m.user?.name || m.user?.email.split("@")[0],
            email: m.user?.email,
            role: m.role as "ADMIN" | "ANALYST" | "VIEWER",
            status: "ACTIVE" as const,
          }));
          setMembers(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [canViewTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInvite) return;

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (res.ok) {
        const newMemberData = await res.json();
        const newMember: Member = {
          id: newMemberData.id,
          name: newMemberData.user?.name || inviteEmail.split("@")[0],
          email: inviteEmail,
          role: inviteRole,
          status: "PENDING",
        };
        setMembers((prev) => [...prev, newMember]);
      }
    } catch {
      // Fallback UI handling
    }
    setShowInviteModal(false);
    setInviteEmail("");
  };

  const handleRoleChange = (id: string, newRole: "ADMIN" | "ANALYST" | "VIEWER") => {
    if (!canManageRoles) return;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
  };

  if (!canViewTeam) {
    return (
      <DashboardLayout>
        <div className="border-b border-slate-800/80 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Team Members & RBAC Permissions</span>
          </h1>
        </div>

        <Card className="p-12 text-center space-y-4 max-w-xl mx-auto border-amber-500/30 bg-amber-500/5 mt-8">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">403 Forbidden — Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Team & RBAC management is restricted to authorized administrative roles. Analysts and Viewers are not permitted to view, invite, or modify workspace members.
          </p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-400" />
            <span>Team Members & RBAC Permissions</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage workspace access levels across Admin, Analyst, and Viewer roles
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.2)] transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Teammate</span>
          </button>
        )}
      </div>

      {/* Role Permission Specs Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
            <Shield className="w-4 h-4" /> ADMIN ROLE
          </div>
          <p className="text-xs text-slate-400">Full access to workspace settings, billing, team invitations, and data deletion.</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 font-mono">
            <Shield className="w-4 h-4" /> ANALYST ROLE
          </div>
          <p className="text-xs text-slate-400">Ingest feedback, CSV uploads, manage status workflow, and run AI features.</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-mono">
            <Shield className="w-4 h-4" /> VIEWER ROLE
          </div>
          <p className="text-xs text-slate-400">Read-only access to dashboards, feedback inbox, and Voice-of-Customer reports.</p>
        </div>
      </div>

      {/* Members Table / Empty State */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading team members...</span>
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            title="No Team Members Found"
            description="Invite teammates to collaborate in your active workspace with role-based access control."
            actionLabel={canInvite ? "Invite Teammate" : undefined}
            onAction={canInvite ? () => setShowInviteModal(true) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Member Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Assigned RBAC Role</th>
                  <th className="py-4 px-6">Status</th>
                  {canManageRoles && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-4 px-6 font-semibold text-white">{m.name}</td>
                    <td className="py-4 px-6 font-mono text-slate-400">{m.email}</td>
                    <td className="py-4 px-6">
                      {canManageRoles ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.id, e.target.value as "ADMIN" | "ANALYST" | "VIEWER")
                          }
                          className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <span className="font-bold text-slate-300">{m.role}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    {canManageRoles && (
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setMembers(members.filter((item) => item.id !== m.id))}
                          className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      {canInvite && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Teammate to Workspace"
        >
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Teammate Work Email
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Role Assignment
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "ANALYST" | "VIEWER")}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="ANALYST">Analyst (Ingest feedback & AI tools)</option>
                <option value="VIEWER">Viewer (Read-only access)</option>
                <option value="ADMIN">Admin (Full workspace control)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md"
              >
                Send Invitation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
