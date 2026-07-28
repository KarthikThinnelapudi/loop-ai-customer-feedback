"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Sparkles, Plus, Command, User, Shield } from "lucide-react";

export default function Topbar({
  onOpenNewFeedback,
}: {
  onOpenNewFeedback?: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="h-20 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition w-64 md:w-80"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-normal">Search feedback, themes, quotes...</span>
          <kbd className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono flex items-center gap-1">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Topbar Actions & User Badge */}
      <div className="flex items-center gap-4">
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          AI Grounding Active
        </span>

        {onOpenNewFeedback && (
          <button
            onClick={onOpenNewFeedback}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Feedback</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* Notifications */}
        <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
        </button>

        {/* User Badge */}
        <Link
          href="/profile"
          className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Admin</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Cmd+K Search Modal Mock */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 px-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search feedback quotes..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-mono">ESC</span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto p-2">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Recent Searches</p>
              <div className="p-3 rounded-xl hover:bg-slate-800 text-sm text-slate-300 cursor-pointer flex justify-between">
                <span>&quot;Onboarding latency in v2 release&quot;</span>
                <span className="text-xs text-slate-500">42 results</span>
              </div>
              <div className="p-3 rounded-xl hover:bg-slate-800 text-sm text-slate-300 cursor-pointer flex justify-between">
                <span>&quot;SSO SAML authentication requests&quot;</span>
                <span className="text-xs text-slate-500">28 results</span>
              </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}
