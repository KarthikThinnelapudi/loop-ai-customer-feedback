"use client";

import { Sparkles, Layers, Cpu, Search, FileText, Database, ShieldCheck, Zap } from "lucide-react";
import MotionWrapper from "@/components/common/MotionWrapper";

const featuresList = [
  {
    icon: Cpu,
    title: "AI Auto-Classification",
    description: "Every ticket, review, or note is automatically tagged with sentiment scores (-1..1), category labels, and feature areas.",
    color: "from-emerald-500/20 to-emerald-500/5",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    icon: Layers,
    title: "Dynamic Theme Clustering",
    description: "Unsupervised topic grouping automatically clusters related customer complaints and flags emerging spikes in real-time.",
    color: "from-teal-500/20 to-teal-500/5",
    borderColor: "border-teal-500/30",
    iconColor: "text-teal-400",
  },
  {
    icon: Search,
    title: "Ask LOOP (Grounded RAG)",
    description: "Ask natural language questions across your feedback repository. Grounded in exact quotes with verified citation cards.",
    color: "from-cyan-500/20 to-cyan-500/5",
    borderColor: "border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    icon: FileText,
    title: "Voice-of-Customer Reports",
    description: "One-click executive digests pre-compute hard statistics and AI-generated narrative summaries ready to export.",
    color: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    icon: Database,
    title: "Multi-Channel Ingestion",
    description: "Bulk CSV uploads, single feedback entry, and simulated integration streams (Zendesk, Intercom, App Store).",
    color: "from-amber-500/20 to-amber-500/5",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Multi-Tenancy & RBAC",
    description: "Strict workspace data isolation enforced at database level with Admin, Analyst, and Viewer role permissions.",
    color: "from-rose-500/20 to-rose-500/5",
    borderColor: "border-rose-500/30",
    iconColor: "text-rose-400",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          Engineered for Product Teams
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Everything You Need to Turn <br />
          <span className="text-emerald-400">Feedback into Roadmap Decisions</span>
        </h2>
        <p className="mt-4 text-slate-300 text-lg">
          Built from the ground up to eliminate gut-feeling prioritizing and replace it with evidence-backed insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuresList.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <MotionWrapper
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-2xl bg-gradient-to-b ${item.color} border ${item.borderColor} p-8 backdrop-blur-xl hover:scale-[1.02] transition-all duration-300 group`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center mb-6 group-hover:border-emerald-500/50 transition-colors">
                <IconComponent className={`w-6 h-6 ${item.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center justify-between">
                <span>{item.title}</span>
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {item.description}
              </p>
            </MotionWrapper>
          );
        })}
      </div>
    </section>
  );
}

