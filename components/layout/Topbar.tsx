"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  MessageSquare,
  TrendingUp,
  FileText,
  Bot,
  Users,
} from "lucide-react";
import { useDismissablePanel } from "@/hooks/useDismissablePanel";
import { hasPermission } from "@/lib/rbac";

interface NotificationItem {
  id: string;
  type: "AI" | "REPORT" | "INGEST" | "MEMBER" | "SECURITY";
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

interface SearchResultItem {
  id: string;
  type: "FEEDBACK" | "THEME" | "REPORT" | "DOCUMENT" | "CHAT" | "USER";
  title: string;
  subtitle: string;
  targetUrl: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "AI",
    title: "AI Auto-Classification Complete",
    description: "25 newly ingested feedback items successfully classified with sentiment scores.",
    time: "5 mins ago",
    read: false,
    link: "/feedback",
  },
  {
    id: "notif-2",
    type: "REPORT",
    title: "VoC Executive Digest Ready",
    description: "Weekly Voice-of-Customer report generated for Jul 21 - Jul 28.",
    time: "25 mins ago",
    read: false,
    link: "/reports",
  },
  {
    id: "notif-3",
    type: "MEMBER",
    title: "New Team Member Joined",
    description: "Sarah Jenkins joined Acme Production Workspace as Analyst.",
    time: "2 hours ago",
    read: true,
    link: "/settings/team",
  },
];

export default function Topbar({
  onOpenNewFeedback,
}: {
  onOpenNewFeedback?: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role?.toUpperCase() || "VIEWER";

  const canViewSettings = hasPermission(userRole, "workspace:settings");
  const canViewTeam = hasPermission(userRole, "team:view") || hasPermission(userRole, "users:manage");

  const {
    openPanel,
    closeAll,
    searchInputRef,
    isSearchOpen,
    isNotifOpen,
    isProfileOpen,
  } = useDismissablePanel();

  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Keyboard Cmd+K shortcut to toggle search panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPanel("search");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openPanel]);

  // Arrow Key Navigation & Enter Key trigger inside Search Panel
  useEffect(() => {
    if (!isSearchOpen) {
      setSelectedIndex(-1);
      return;
    }

    const handleSearchKeys = (e: KeyboardEvent) => {
      if (searchResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < searchResults.length) {
        e.preventDefault();
        const target = searchResults[selectedIndex];
        if (target) {
          handleResultClick(target.targetUrl);
        }
      }
    };

    window.addEventListener("keydown", handleSearchKeys);
    return () => window.removeEventListener("keydown", handleSearchKeys);
  }, [isSearchOpen, searchResults, selectedIndex]);

  // Debounced Global Search API Query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.warn("Global Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleResultClick = (targetUrl: string) => {
    closeAll();
    setSearchQuery("");
    router.push(targetUrl);
  };

  const getItemIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "FEEDBACK":
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case "THEME":
        return <TrendingUp className="w-4 h-4 text-teal-400" />;
      case "REPORT":
        return <FileText className="w-4 h-4 text-amber-400" />;
      case "DOCUMENT":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "CHAT":
        return <Bot className="w-4 h-4 text-emerald-400" />;
      case "USER":
        return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Trigger Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => openPanel("search")}
          aria-label="Search workspace"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-slate-400 transition w-56 sm:w-72 md:w-80 ${
            isSearchOpen
              ? "bg-slate-900 border-emerald-500 text-white ring-2 ring-emerald-500/20"
              : "bg-slate-900/80 border-slate-800 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-normal truncate">Search quotes, themes, reports...</span>
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
            onClick={() => openPanel("notif")}
            aria-label="Notifications"
            className={`p-2.5 rounded-xl border transition relative ${
              isNotifOpen
                ? "bg-slate-900 border-emerald-500 text-white ring-2 ring-emerald-500/20"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeAll} />

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

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-emerald-400 hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={closeAll}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
                        onClick={() => {
                          if (n.link) {
                            closeAll();
                            router.push(n.link);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
                          !n.read
                            ? "bg-slate-950 border-emerald-500/30 hover:border-emerald-500/60"
                            : "bg-slate-950/50 border-slate-800/80 opacity-70 hover:opacity-100"
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

        {/* Dynamic User Badge / Profile Menu (Strict RBAC Enforced) */}
        <div className="relative">
          <button
            onClick={() => openPanel("profile")}
            className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline capitalize">
                {userRole.toLowerCase()}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">
              <User className="w-3.5 h-3.5" />
            </div>
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeAll} />
              <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-2xl p-2 shadow-2xl z-50 text-xs space-y-1">
                <Link
                  href="/profile"
                  onClick={closeAll}
                  className="block px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  My Profile
                </Link>

                {/* Workspace Settings (Admin & Owner ONLY) */}
                {canViewSettings && (
                  <Link
                    href="/settings"
                    onClick={closeAll}
                    className="block px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    Workspace Settings
                  </Link>
                )}

                {/* Team & RBAC (Admin & Owner ONLY) */}
                {canViewTeam && (
                  <Link
                    href="/settings/team"
                    onClick={closeAll}
                    className="block px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    Team & RBAC
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Command Palette Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 transition-opacity duration-200"
          onClick={closeAll}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type query: 'onboarding', 'sso', 'report', 'Sarah Jenkins'..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
              />
              <button
                onClick={closeAll}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto p-2">
              {searchLoading ? (
                <p className="text-xs text-slate-500 italic p-3 text-center">Searching workspace items...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleResultClick(item.targetUrl)}
                    className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-1 flex items-center gap-3 group ${
                      selectedIndex === idx
                        ? "bg-slate-800 border-emerald-500 text-white shadow-md"
                        : "bg-slate-950 border-slate-800 hover:border-emerald-500/50"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No matching workspace items found for &quot;{searchQuery}&quot;.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Example Searches</p>
                  {["onboarding latency", "sso saml requests", "executive report", "Sarah Jenkins"].map((ex) => (
                    <div
                      key={ex}
                      onClick={() => setSearchQuery(ex)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 cursor-pointer flex justify-between transition"
                    >
                      <span>&quot;{ex}&quot;</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Try search →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
