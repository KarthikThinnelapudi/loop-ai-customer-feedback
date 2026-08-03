"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Sparkles,
  TrendingUp,
  FileText,
  Settings,
  User,
  Users,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
} from "lucide-react";

import LoopLogo from "@/app/components/logo/LoopLogo";

const allNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OWNER", "MANAGER", "ANALYST", "ANALYST_ASSISTANT", "REVIEWER", "VIEWER", "MEMBER"] },
  { label: "Feedback Inbox", href: "/feedback", icon: Inbox, badge: "12", roles: ["ADMIN", "OWNER", "MANAGER", "ANALYST", "ANALYST_ASSISTANT", "REVIEWER", "VIEWER", "MEMBER"] },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN", "OWNER", "MANAGER", "ANALYST", "ANALYST_ASSISTANT", "MEMBER"] },
  { label: "Ask LOOP AI", href: "/ask", icon: Sparkles, highlight: true, roles: ["ADMIN", "OWNER", "MANAGER", "ANALYST", "ANALYST_ASSISTANT", "MEMBER"] },
  { label: "Trends & Spikes", href: "/trends", icon: TrendingUp, roles: ["ADMIN", "OWNER", "MANAGER", "ANALYST", "MEMBER"] },
  { label: "VoC Reports", href: "/reports", icon: FileText, roles: ["ADMIN", "OWNER", "MANAGER", "ANALYST", "ANALYST_ASSISTANT", "REVIEWER", "VIEWER", "MEMBER"] },
];

const allWorkspaceItems = [
  { label: "Team Members", href: "/settings/team", icon: Users, roles: ["ADMIN", "OWNER", "MANAGER"] },
  { label: "Activity Audit", href: "/settings/activity", icon: Activity, roles: ["ADMIN", "OWNER", "MANAGER"] },
  { label: "Workspace Settings", href: "/settings", icon: Settings, roles: ["ADMIN", "OWNER", "MANAGER"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  const userRole = (session?.user as { role?: string })?.role?.toUpperCase() || "ADMIN";

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));
  const workspaceItems = allWorkspaceItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={`sticky top-0 h-screen bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        {/* Logo & Collapse Toggle */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800/80">
          {!collapsed ? (
            <Link href="/dashboard">
              <LoopLogo />
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              L
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Workspace Switcher Pill */}
        {!collapsed && (
          <div className="mx-4 mt-5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">Acme Production</p>
                <p className="text-[10px] text-emerald-400 font-mono font-bold">{userRole} ROLE</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 mt-2">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
              Core Intelligence
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive
                        ? "text-emerald-400"
                        : item.highlight
                        ? "text-emerald-400 animate-pulse"
                        : "text-slate-400"
                    }`}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {!collapsed && workspaceItems.length > 0 && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 font-mono">
              Workspace & Team
            </p>
          )}

          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{session?.user?.name || "User"}</p>
                <p className="text-[10px] text-slate-400 truncate">{session?.user?.email || "user@acme.com"}</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm">
              U
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
