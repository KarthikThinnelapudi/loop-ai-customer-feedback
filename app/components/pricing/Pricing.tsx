"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "Forever Free",
    description: "Perfect for early-stage teams & individual builders.",
    features: [
      "Up to 1,000 feedback items / mo",
      "AI Auto-Classification",
      "Basic Theme Clustering",
      "Standard Analytics Dashboard",
      "Single Workspace & 2 Members",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/ month",
    description: "Designed for fast-growing SaaS products and product managers.",
    features: [
      "Up to 25,000 feedback items / mo",
      "Ask LOOP Grounded Q&A (RAG)",
      "Weekly Voice-of-Customer Reports",
      "Spike Detection & Trend Alerts",
      "CSV Bulk Upload & Integration Feeds",
      "5 Workspaces & 10 Members",
    ],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/ month",
    description: "Dedicated security, custom SLA, and unlimited workspace capacity.",
    features: [
      "Unlimited feedback volume",
      "Custom AI Classifier Rules & Zod Schemas",
      "pgvector Dedicated Indexing",
      "Full Audit Logs & Activity Tracker",
      "Unlimited Workspaces & Role RBAC",
      "24/7 Priority Support & Dedicated Rep",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          Transparent Pricing
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Flexible Plans for <span className="text-emerald-400">Every Team Scale</span>
        </h2>
        <p className="mt-4 text-slate-300 text-lg">
          No hidden fees. Scale your customer feedback intelligence as your product grows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative rounded-3xl p-8 flex flex-col justify-between backdrop-blur-2xl transition-all duration-300 ${
              plan.popular
                ? "bg-slate-900/90 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] scale-[1.03]"
                : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular
              </div>
            )}

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6 min-h-[40px]">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-slate-300 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/signup"
              className={`w-full py-4 rounded-xl font-bold text-center text-sm transition-all duration-300 ${
                plan.popular
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
