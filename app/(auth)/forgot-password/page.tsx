"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ArrowLeft, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [resentNotice, setResentNotice] = useState(false);
  
  // 60s resend cooldown timer
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // 10-minute (600s) server expiration timer
  const [expireCountdown, setExpireCountdown] = useState(600);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mask email helper
  const maskEmail = (str: string) => {
    if (!str || !str.includes("@")) return str || "your email";
    const [local, domain] = str.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    if (step === "otp" && resendCountdown > 0 && !canResend) {
      const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0) {
      setCanResend(true);
    }
  }, [step, resendCountdown, canResend]);

  // Expire countdown timer (10 minutes)
  useEffect(() => {
    if (step === "otp" && expireCountdown > 0) {
      const timer = setTimeout(() => setExpireCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, expireCountdown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendEmail = async (e: React.FormEvent) => {
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
        setStep("otp");
        setResendCountdown(60);
        setExpireCountdown(600);
        setCanResend(false);
      } else {
        setErrorMsg(data.message || "Failed to process request. Please try again.");
      }
    } catch {
      setLoading(false);
      setErrorMsg("Network error sending password reset code.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          step: "verify-otp",
          otp: fullOtp,
          email,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.valid) {
        // Redirect to Reset Password Page with verified OTP token and email
        router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(fullOtp)}`);
      } else {
        setErrorMsg(data.message || "Invalid or expired verification code.");
      }
    } catch {
      setLoading(false);
      setErrorMsg("Network error verifying code.");
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setErrorMsg("");
    setResentNotice(false);

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
      setResending(false);

      if (res.ok) {
        setResentNotice(true);
        setCanResend(false);
        setResendCountdown(60);
        setExpireCountdown(600);
      } else {
        setErrorMsg(data.message || "Failed to resend code.");
      }
    } catch {
      setResending(false);
      setErrorMsg("Error resending reset code.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)] max-w-md mx-auto text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6">
        {step === "email" ? <Mail className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
      </div>

      {step === "email" ? (
        <>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Reset your password</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your email and we&apos;ll send you a 6-digit verification code.
            </p>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-5 text-left">
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
              disabled={loading || !email}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Verify reset code</h1>
            <p className="mt-2 text-sm text-slate-400">
              We&apos;ve sent a 6-digit code to <span className="text-emerald-400 font-mono font-bold">{maskEmail(email)}</span>
            </p>
          </div>

          <div className="space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {resentNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>New reset verification code sent to your email!</span>
              </div>
            )}

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
                disabled={otp.join("").length !== 6 || loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify Code & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Code expires in: <strong className="text-white">{formatTimer(expireCountdown)}</strong></span>
              </div>

              <div className="flex items-center justify-between pt-1 font-medium">
                <span>Didn&apos;t receive code?</span>
                <button
                  onClick={handleResendOtp}
                  disabled={!canResend || resending}
                  className="text-emerald-400 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
                >
                  {resending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : canResend ? (
                    "Resend code"
                  ) : (
                    `Resend in ${resendCountdown}s`
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <p className="mt-8 text-center text-sm text-slate-400 flex items-center justify-center gap-1">
        <ArrowLeft className="w-4 h-4 text-slate-500" />
        <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
