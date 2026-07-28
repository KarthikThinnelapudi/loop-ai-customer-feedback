"use client";

import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = "No Feedback Found",
  description = "No customer feedback items match your active filters or query.",
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-950/40 my-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center mb-4">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
