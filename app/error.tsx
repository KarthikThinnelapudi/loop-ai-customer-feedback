"use client";

import { useEffect } from "react";
import Link from "next/link";
import BackgroundAnimation from "./components/animations/BackgroundAnimation";
import LoopLogo from "./components/logo/LoopLogo";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 relative overflow-hidden">
      <BackgroundAnimation />

      <header className="relative z-10">
        <LoopLogo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center relative z-10 max-w-md mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold text-white">Something Went Wrong</h1>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          An unexpected application error occurred while processing workspace data.
        </p>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition border border-slate-700"
          >
            Dashboard
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 font-mono relative z-10">
        © 2026 LOOP AI. Enterprise Customer Intelligence.
      </footer>
    </div>
  );
}
