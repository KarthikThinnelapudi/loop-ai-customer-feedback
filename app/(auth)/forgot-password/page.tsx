"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || "Failed to process request. Please try again.");
      }
    } catch {
      setLoading(false);
      setErrorMsg("Network error sending password reset email.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)] max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your LOOP AI account email address to receive password recovery instructions
        </p>
      </div>

      {submitted ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Reset Link Sent</h2>
          <p className="text-sm text-slate-400">
            If an account exists for <span className="text-emerald-400 font-mono">{email}</span>, a secure password reset link has been dispatched to your inbox.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
            >
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-slate-400">
        Remember your password?{" "}
        <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
          Back to Login
        </Link>
      </p>
    </motion.div>
  );
}
