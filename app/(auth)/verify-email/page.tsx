"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Edit3, Clock, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resentNotice, setResentNotice] = useState(false);

  // 60s resend cooldown timer
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // 10-minute (600s) server expiration timer
  const [expireCountdown, setExpireCountdown] = useState(600);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mask email helper (e.g. k***k@domain.com)
  const maskEmail = (str: string) => {
    if (!str || !str.includes("@")) return str || "your email";
    const [local, domain] = str.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCountdown > 0 && !canResend) {
      const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
  }, [resendCountdown, canResend]);

  // Expire countdown timer (10 minutes)
  useEffect(() => {
    if (expireCountdown > 0) {
      const timer = setTimeout(() => setExpireCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expireCountdown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
        }, 2200);
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
        setResendCountdown(60);
        setExpireCountdown(600); // Reset 10-min timer on new OTP
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
      className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)] text-center max-w-md mx-auto relative"
    >
      {!success ? (
        <>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6">
            <Mail className="w-7 h-7" />
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">Verify Your Email</h1>
          <p className="mt-2 text-sm text-slate-400">
            We&apos;ve sent a verification code to your email address.
          </p>

          {/* Email Display & Edit Bar */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {!isEditingEmail ? (
              <>
                <span className="font-mono text-emerald-400 text-sm font-bold truncate max-w-[240px]">
                  {maskEmail(email || emailParam)}
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
              <p className="text-sm text-slate-300">Validating 6-digit OTP code...</p>
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
                  <span>New 6-digit verification code sent to your inbox!</span>
                </div>
              )}

              {/* 6-Digit OTP Inputs */}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
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
                  <span>Verify OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Countdown & Resend Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Code expires in: <strong className="text-white">{formatTimer(expireCountdown)}</strong></span>
                </div>

                <div className="flex items-center justify-between pt-1 font-medium">
                  <span>Didn&apos;t receive the code?</span>
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
                      `Resend in ${resendCountdown}s`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Successful OTP Verification Screen */
        <div className="py-6 space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Email Verified Successfully
            </h2>
            <p className="text-sm text-slate-300">
              Your email has been verified successfully. Your workspace is ready!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Workspace Admin Credentials Activated</span>
            </div>
            <p className="text-slate-400">Welcome email dispatched. Redirecting to your workspace dashboard...</p>
          </div>

          <Link
            href="/dashboard?welcome=true"
            className="inline-flex items-center justify-center w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm transition shadow-[0_0_30px_rgba(16,185,129,0.3)] gap-2"
          >
            <span>Continue to Workspace</span>
            <ArrowRight className="w-4 h-4" />
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
