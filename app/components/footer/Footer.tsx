"use client";

import Link from "next/link";
import LoopLogo from "../logo/LoopLogo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <LoopLogo />
          <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
            Transforming customer feedback into evidence-backed roadmap decisions with real-time sentiment analysis, theme clustering, and grounded RAG AI.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><a href="#features" className="hover:text-emerald-400 transition">Features</a></li>
            <li><a href="#dashboard-preview" className="hover:text-emerald-400 transition">Dashboard</a></li>
            <li><a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a></li>
            <li><Link href="/dashboard" className="hover:text-emerald-400 transition">App Demo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><a href="#how-it-works" className="hover:text-emerald-400 transition">Documentation</a></li>
            <li><a href="#faq" className="hover:text-emerald-400 transition">FAQ</a></li>
            <li><Link href="/login" className="hover:text-emerald-400 transition">Sign In</Link></li>
            <li><Link href="/signup" className="hover:text-emerald-400 transition">Register</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><span className="cursor-pointer hover:text-emerald-400 transition">Privacy Policy</span></li>
            <li><span className="cursor-pointer hover:text-emerald-400 transition">Terms of Service</span></li>
            <li><span className="cursor-pointer hover:text-emerald-400 transition">Security Overview</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 font-mono">
        © 2026 LOOP AI Inc. All Rights Reserved. Multi-Tenant AI Customer Intelligence Platform.
      </div>
    </footer>
  );
}
