"use client";

import { TrendingUp, Smile, AlertTriangle, MessageSquare, Layers, Sparkles } from "lucide-react";
import MotionWrapper from "@/components/common/MotionWrapper";

export default function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="relative py-20 px-6 max-w-6xl mx-auto z-10">
      <MotionWrapper
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(16,185,129,0.12)]"
      >
        {/* Mock Topbar */}

        <div className="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs text-slate-400 font-mono ml-3">Acme Corp / Production Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              AI Grounded RAG Active
            </span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 p-6">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>😊 Sentiment Score</span>
              <Smile className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-bold mt-3 text-emerald-300">84.2%</h3>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+6.4% from last week</span>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-teal-500/10 via-slate-900 to-slate-900 border border-teal-500/30 p-6">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>💬 Feedback Volume</span>
              <MessageSquare className="w-4 h-4 text-teal-400" />
            </div>
            <h3 className="text-3xl font-bold mt-3 text-teal-300">10,432</h3>
            <p className="text-slate-400 text-xs mt-2">Parsed across 5 channels</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-rose-500/10 via-slate-900 to-slate-900 border border-rose-500/30 p-6">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>🚨 Critical Spikes</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-3xl font-bold mt-3 text-rose-400">3 Topics</h3>
            <p className="text-slate-400 text-xs mt-2">Onboarding latency + SSO requests</p>
          </div>
        </div>

        {/* Charts & Activity Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulated Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Feedback Trend Velocity
              </h4>
              <span className="text-xs text-slate-400">Last 30 Days</span>
            </div>

            <div className="flex items-end justify-between gap-3 h-44 pt-4 border-b border-slate-800 pb-2">
              {[40, 65, 50, 85, 70, 95, 110, 80, 120, 105, 140, 130].map((h, i) => (
                <div key={i} className="w-full flex flex-col items-center gap-2 group">
                  <div
                    style={{ height: `${h}px` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm group-hover:from-emerald-500 group-hover:to-teal-300 transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>

          {/* AI Cluster List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              AI Key Theme Clusters
            </h4>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Onboarding Friction</p>
                  <p className="text-[11px] text-slate-400">42 mentions • &quot;Setup took too long&quot;</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">Spiking +45%</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Dashboard Speed</p>
                  <p className="text-[11px] text-slate-400">89 mentions • &quot;Extremely fast v2 release&quot;</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Positive 92%</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">SSO &amp; SAML Integration</p>
                  <p className="text-[11px] text-slate-400">28 mentions • Enterprise blocker</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Action Needed</span>
              </div>
            </div>

          </div>
        </div>
      </MotionWrapper>
    </section>
  );
}

