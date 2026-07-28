"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How does multi-tenant data isolation work?",
    a: "Every workspace is assigned a unique workspaceId. All database queries for feedback, themes, embeddings, and reports are strictly scoped to the authenticated user's workspace ID, ensuring complete isolation across companies.",
  },
  {
    q: "How does 'Ask LOOP' avoid hallucinating customer quotes?",
    a: "LOOP uses Retrieval-Augmented Generation (RAG). When you ask a question, the system converts your query into a vector embedding, searches stored feedback using pgvector, and passes ONLY the top-K relevant quotes to the AI as context.",
  },
  {
    q: "Can I import feedback from CSV files or support tools?",
    a: "Yes! LOOP supports drag-and-drop CSV bulk imports, single feedback creation forms, and simulated channel integration streaming (Zendesk, Intercom, App Store reviews).",
  },
  {
    q: "What user roles are supported inside a workspace?",
    a: "We support three role levels: Admin (full workspace and team management), Analyst (ingests and manages feedback, uses AI features), and Viewer (read-only dashboard and report access).",
  },
  {
    q: "How are Voice-of-Customer reports generated?",
    a: "Our backend pre-computes exact statistics (sentiment deltas, theme counts, top quotes) in code, and then asks the AI to synthesize an executive narrative around those exact figures, preventing fabricated metrics.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 max-w-4xl mx-auto relative z-10">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          Got Questions?
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight">
          Frequently Asked <span className="text-emerald-400">Questions</span>
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="text-lg font-semibold text-white">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-400 transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
