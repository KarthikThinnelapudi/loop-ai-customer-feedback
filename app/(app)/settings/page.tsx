"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import SecretKeyMasker from "@/components/common/SecretKeyMasker";
import { hasPermission } from "@/lib/rbac";
import { Building, Key, CheckCircle2, Save, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role?.toUpperCase() || "VIEWER";

  const canManageSettings = hasPermission(userRole, "workspace:settings");

  const [workspaceName, setWorkspaceName] = useState("Acme Production Workspace");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!canManageSettings) {
    return (
      <DashboardLayout>
        <div className="border-b border-slate-800/80 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building className="w-7 h-7 text-emerald-400" />
            <span>Workspace Settings</span>
          </h1>
        </div>

        <Card className="p-12 text-center space-y-4 max-w-xl mx-auto border-amber-500/30 bg-amber-500/5 mt-8">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">403 Forbidden — Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Workspace Settings and tenant configuration controls are restricted to <strong>Owner and Admin</strong> roles. Analysts and Viewers are not authorized to view or manage tenant administration settings.
          </p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Building className="w-7 h-7 text-emerald-400" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage tenant organization details, multi-tenancy keys, and security controls
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Card className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            General Workspace Info
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Workspace Unique Identifier (Tenant Key)
              </label>
              <input
                type="text"
                disabled
                value="ws_acme_prod_9921"
                className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 font-mono text-sm cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used for backend multi-tenant data query scoping.</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saved ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Workspace updated successfully!
                </span>
              ) : <span />}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Card>

        {/* Security & API Keys Card */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-teal-400" />
            Workspace Integration API Keys
          </h3>
          <p className="text-xs text-slate-400">
            Use these keys to send customer feedback from external webhooks (Slack, Intercom, Typeform).
          </p>

          <SecretKeyMasker
            label="Live Ingestion Secret Key"
            secretKey="loop_live_sk_9921481948194819"
            prefix="loop_live_sk_"
            userRole={userRole}
            onRegenerate={() => {
              // Key regeneration handler
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
