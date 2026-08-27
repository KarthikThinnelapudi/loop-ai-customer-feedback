"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Edit3 } from "lucide-react";

export const dynamic = "force-dynamic";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [verifying, setVerifying] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resentNotice, setResentNotice] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-verify if token link param is present
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
            router.push("/dashboard?welcome=true");
          }, 2000);
        } else {
          setErrorMsg(data.message || "Verification link expired or invalid.");
        }
      })
      .catch(() => {
        setVerifying(false);
        setErrorMsg("Network error during verification. Please try again.");
      });
  }, [token, router]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP verification code.");
      return;
    }

    setVerifying(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          otp: fullOtp,
          email: email || emailParam,
        }),
      });

      const data = await res.json();
      setVerifying(false);

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard?welcome=true");
        }, 2000);
      } else {
        setErrorMsg(data.message || "Invalid or expired OTP code.");
      }
    } catch {
      setVerifying(false);
      setErrorMsg("Network error during OTP verification.");
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setErrorMsg("");
    setResentNotice(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ email: email || emailParam }),
      });

      const data = await res.json();
      setResending(false);

      if (res.ok) {
        setResentNotice(true);
        setCanResend(false);
        setCountdown(60);
      } else {
        setErrorMsg(data.message || "Failed to resend verification OTP.");
      }
    } catch {
      setResending(false);
      setErrorMsg("Error resending OTP email.");
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

      <h1 className="text-3xl font-extrabold text-white tracking-tight">Check your email</h1>
      <p className="mt-2 text-sm text-slate-400">
        We&apos;ve sent a 6-digit verification code to:
      </p>

      {/* Email Display & Edit Bar */}
      <div className="mt-2 flex items-center justify-center gap-2">
        {!isEditingEmail ? (
          <>
            <span className="font-mono text-emerald-400 text-sm font-bold truncate max-w-[240px]">
              {email || "your work email"}
            </span>
            <button
              onClick={() => setIsEditingEmail(true)}
              className="text-slate-400 hover:text-white p-1 transition"
              title="Change Email"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full max-w-xs mt-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs w-full focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => setIsEditingEmail(false)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {verifying ? (
        <div className="py-8 space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-300">Validating verification OTP code...</p>
        </div>
      ) : success ? (
        <div className="py-6 space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Email verified successfully! Opening your workspace...</span>
          </div>
          <Link
            href="/dashboard?welcome=true"
            className="inline-flex items-center justify-center w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition shadow-lg shadow-emerald-500/20"
          >
            Go to Workspace Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resentNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>New 6-digit OTP verification code sent to your inbox!</span>
            </div>
          )}

          {/* 6-Digit OTP Boxes */}
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center font-mono text-xl font-bold rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={otp.join("").length !== 6 || verifying}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Resend & Actions Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>Didn&apos;t receive it?</span>
            <button
              onClick={handleResendOtp}
              disabled={!canResend || resending}
              className="text-emerald-400 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
            >
              {resending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : canResend ? (
                "Resend OTP"
              ) : (
                `Resend in ${countdown}s`
              )}
            </button>
          </div>

          <div className="pt-2">
            <Link
              href="/signup"
              className="text-xs text-slate-500 hover:text-slate-300 font-medium transition"
            >
              Need to change email or sign up again?
            </Link>
          </div>
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
