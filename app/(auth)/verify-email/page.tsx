"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResent(true);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)] text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6">
        <Mail className="w-7 h-7" />
      </div>

      <h1 className="text-3xl font-extrabold text-white tracking-tight">Verify Your Email</h1>
      <p className="mt-3 text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
        We sent a verification link to your work email address. Please click the link to confirm your account and access your workspace.
      </p>

      {resent && (
        <div className="my-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>New verification link sent to your email inbox!</span>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <button
          onClick={handleResend}
          disabled={loading || resent}
          className="w-full py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-semibold text-sm hover:bg-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Resend Verification Email</span>
            </>
          )}
        </button>

        <Link
          href="/login"
          className="block w-full py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-900 transition"
        >
          Return to Sign In
        </Link>
      </div>
    </motion.div>
  );
}
