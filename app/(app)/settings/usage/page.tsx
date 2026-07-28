"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import { Cpu, Database, Zap, Sparkles } from "lucide-react";

export default function UsagePage() {
  return (
    <DashboardLayout>
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Cpu className="w-7 h-7 text-emerald-400" />
          <span>Usage & AI Token Capacity</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor your workspace AI classification tokens, pgvector embeddings, and monthly feedback volume limits
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Token Consumption Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>AI LLM Tokens</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">42,150 / 250,000</h3>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-[17%]" />
          </div>
          <p className="text-xs text-slate-400">17% of monthly Claude AI quota consumed.</p>
        </Card>

        {/* Vector Embeddings Index */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>pgvector Embeddings</span>
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">548 / 10,000</h3>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full w-[5%]" />
          </div>
          <p className="text-xs text-slate-400">548 feedback vectors stored for Ask LOOP RAG.</p>
        </Card>

        {/* Workspace Tier Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Active Plan Tier</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-400">PRO TIER</h3>
          <p className="text-xs text-slate-400">Renews on August 28, 2026.</p>
          <button className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition">
            Manage Subscription
          </button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
