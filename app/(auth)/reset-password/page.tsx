"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password Requirement Checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing from URL. Please use the link sent in your email.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password does not meet all complexity requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || "Failed to reset password. The reset link may be invalid or expired.");
      }
    } catch {
      setLoading(false);
      setError("Network error resetting password. Please try again.");
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
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Set New Password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your new password below to secure your LOOP AI workspace account
        </p>
      </div>

      {submitted ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Password Updated Successfully!</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your LOOP AI password has been updated and a security confirmation email has been dispatched. You may now log in.
          </p>
          <div className="pt-4">
            <Link
              href="/login?reset=success"
              className="inline-flex items-center justify-center w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition shadow-[0_0_25px_rgba(16,185,129,0.25)]"
            >
              Proceed to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!tokenParam && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
                className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full pl-11 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Meter */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-semibold mb-1">
              <span>Password Requirements</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <span className={hasMinLength ? "text-emerald-400 font-medium" : "text-slate-500"}>
                {hasMinLength ? "✓" : "○"} At least 8 chars
              </span>
              <span className={hasUppercase ? "text-emerald-400 font-medium" : "text-slate-500"}>
                {hasUppercase ? "✓" : "○"} Uppercase letter
              </span>
              <span className={hasLowercase ? "text-emerald-400 font-medium" : "text-slate-500"}>
                {hasLowercase ? "✓" : "○"} Lowercase letter
              </span>
              <span className={hasNumber ? "text-emerald-400 font-medium" : "text-slate-500"}>
                {hasNumber ? "✓" : "○"} Number (0-9)
              </span>
              <span className={`col-span-2 ${hasSpecial ? "text-emerald-400 font-medium" : "text-slate-500"}`}>
                {hasSpecial ? "✓" : "○"} Special character (!@#$%^&*)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-11 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white font-mono text-xs">Loading reset page...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
