"use client";

import { Target, Users, Headphones, BarChart2 } from "lucide-react";
import MotionWrapper from "@/components/common/MotionWrapper";

const cases = [
  {
    icon: Target,
    title: "Product Managers",
    description: "Prioritize your product roadmap based on real quantitative customer sentiment and trend frequency rather than internal opinion.",
    metric: "4x Faster Roadmap Specs",
  },
  {
    icon: Headphones,
    title: "Customer Support Leads",
    description: "Spot recurring bug spikes and support friction early before they turn into customer churn or negative app store reviews.",
    metric: "-35% Churn Risk",
  },
  {
    icon: Users,
    title: "Founders & Executives",
    description: "Receive auto-generated weekly Voice-of-Customer digests summarizing top theme spikes and verbatim quotes for executive syncs.",
    metric: "100% Grounded Summaries",
  },
  {
    icon: BarChart2,
    title: "UX Research Teams",
    description: "Cluster qualitative user interviews and NPS free-text feedback into structured, searchable themes with semantic search.",
    metric: "Instant Semantic Search",
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="py-20 px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">
          Built for Cross-Functional <span className="text-emerald-400">Product Excellence</span>
        </h2>
        <p className="mt-4 text-slate-300 text-base">
          See how different roles across your company leverage LOOP AI to drive decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cases.map((c, i) => {
          const IconComp = c.icon;
          return (
            <MotionWrapper
              key={c.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {c.metric}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{c.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{c.description}</p>
              </div>
            </MotionWrapper>
          );
        })}
      </div>
    </section>
  );
}

