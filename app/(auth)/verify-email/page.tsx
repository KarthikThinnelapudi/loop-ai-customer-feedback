"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const [verifying, setVerifying] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    setVerifying(true);
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json().then((data) => ({ status: res.status, data })))
      .then(({ status, data }) => {
        setVerifying(false);
        if (status === 200) {
          setSuccess(true);
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
        } else {
          setErrorMsg(data.message || "Email verification failed. The link may be expired or invalid.");
        }
      })
      .catch(() => {
        setVerifying(false);
        setErrorMsg("Network error during email verification. Please try again.");
      });
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setResending(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResending(false);
      if (res.ok) {
        setResent(true);
      } else {
        setErrorMsg(data.message || "Failed to resend verification email.");
      }
    } catch {
      setResending(false);
      setErrorMsg("Error resending verification email.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)] text-center max-w-md mx-auto"
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6">
        <Mail className="w-7 h-7" />
      </div>

      <h1 className="text-3xl font-extrabold text-white tracking-tight">LOOP AI Email Verification</h1>

      {verifying ? (
        <div className="py-8 space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-300">Validating your email verification link...</p>
        </div>
      ) : success ? (
        <div className="py-6 space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Email verified successfully! Welcome email sent. Redirecting to login...</span>
          </div>
          <Link
            href="/login"
            className="inline-block w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition shadow-lg shadow-emerald-500/20"
          >
            Log In to LOOP AI
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mt-3">
          <p className="text-sm text-slate-400 leading-relaxed">
            We sent a verification link to your work email. Click the link in the email or enter your address below to resend.
          </p>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resent && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>New verification link sent to your email inbox!</span>
            </div>
          )}

          <form onSubmit={handleResend} className="space-y-3 pt-2">
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={resending}
              className="w-full py-3.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white font-semibold text-sm hover:bg-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          </form>

          <Link
            href="/login"
            className="block w-full py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-900 transition mt-2"
          >
            Return to Sign In
          </Link>
        </div>
      )}
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white font-mono text-xs">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
