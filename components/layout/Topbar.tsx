"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Sparkles,
  Plus,
  Command,
  User,
  Shield,
  X,
  Check,
  FileText,
  Activity,
  UserPlus,
  ShieldAlert,
  Inbox,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "AI" | "REPORT" | "INGEST" | "MEMBER" | "SECURITY";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "AI",
    title: "AI Auto-Classification Complete",
    description: "25 newly ingested feedback items successfully classified with sentiment scores.",
    time: "5 mins ago",
    read: false,
  },
  {
    id: "notif-2",
    type: "REPORT",
    title: "VoC Executive Digest Ready",
    description: "Weekly Voice-of-Customer report generated for Jul 21 - Jul 28.",
    time: "25 mins ago",
    read: false,
  },
  {
    id: "notif-3",
    type: "MEMBER",
    title: "New Team Member Joined",
    description: "Sarah Jenkins joined Acme Production Workspace as Analyst.",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "notif-4",
    type: "SECURITY",
    title: "Security Audit Alert",
    description: "Admin role assigned to elena@acme.com.",
    time: "1 day ago",
    read: true,
  },
];

export default function Topbar({
  onOpenNewFeedback,
}: {
  onOpenNewFeedback?: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Cmd+K shortcut to open, and ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowNotifs(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when search modal is active
  useEffect(() => {
    if (showSearch) {
      document.body.style.overflow = "hidden";
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showSearch]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition w-56 sm:w-72 md:w-80"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-normal truncate">Search feedback, themes, quotes...</span>
          <kbd className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono hidden sm:flex items-center gap-1">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Topbar Actions & User Badge */}
      <div className="flex items-center gap-3 md:gap-4">
        <span className="hidden lg:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          AI Grounding Active
        </span>

        {onOpenNewFeedback && (
          <button
            onClick={onOpenNewFeedback}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ingest Feedback</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Notifications"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifs(false)}
              />
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl p-4 shadow-2xl z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-emerald-400 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-white">You&apos;re all caught up!</p>
                      <p className="text-[11px] text-slate-400">No new notifications in your workspace.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                          !n.read
                            ? "bg-slate-950 border-emerald-500/30"
                            : "bg-slate-950/50 border-slate-800/80 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{n.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{n.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Badge */}
        <Link
          href="/profile"
          className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">Admin</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Global Search Modal */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 px-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a command or search feedback quotes..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto p-2">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Recent Workspace Searches</p>
              <div
                onClick={() => setShowSearch(false)}
                className="p-3 rounded-xl hover:bg-slate-800 text-sm text-slate-300 cursor-pointer flex justify-between transition"
              >
                <span>&quot;Onboarding latency in v2 release&quot;</span>
                <span className="text-xs text-slate-500 font-mono">42 results</span>
              </div>
              <div
                onClick={() => setShowSearch(false)}
                className="p-3 rounded-xl hover:bg-slate-800 text-sm text-slate-300 cursor-pointer flex justify-between transition"
              >
                <span>&quot;SSO SAML authentication requests&quot;</span>
                <span className="text-xs text-slate-500 font-mono">28 results</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

