import Link from "next/link";
import BackgroundAnimation from "@/app/components/animations/BackgroundAnimation";
import LoopLogo from "@/app/components/logo/LoopLogo";
import { Lock, ArrowRight } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 relative overflow-hidden">
      <BackgroundAnimation />

      <header className="relative z-10">
        <LoopLogo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center relative z-10 max-w-md mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="text-5xl font-extrabold text-white font-mono">401</h1>
        <h2 className="text-2xl font-bold text-white mt-2">Authentication Required</h2>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          You must be signed in to access this workspace resource. Please log in to your account.
        </p>

        <Link
          href="/login"
          className="mt-8 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] transition flex items-center gap-2"
        >
          <span>Sign In to Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>

      <footer className="text-center text-xs text-slate-500 font-mono relative z-10">
        © 2026 LOOP AI. Enterprise Customer Intelligence.
      </footer>
    </div>
  );
}
