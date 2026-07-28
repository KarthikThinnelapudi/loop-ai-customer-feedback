"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!workspaceName.trim()) {
        setError("Please enter a workspace name.");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName,
          name,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create workspace account.");
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {step === 1 ? "Create Workspace" : "Admin Account"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === 1
            ? "Step 1 of 2: Name your tenant organization"
            : "Step 2 of 2: Create your Admin user login"}
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-slate-800"}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-slate-800"}`} />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 ? (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Workspace / Company Name
            </label>
            <div className="relative">
              <Building className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp, Linear, Retool"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>You will be designated as Workspace Admin</span>
              </div>
              <p>Workspaces use isolated tenant databases with RBAC security.</p>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-3.5 px-5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition"
            >
              Back
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{step === 1 ? "Next: Admin Details" : "Complete Registration"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        Already have a workspace?{" "}
        <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </motion.div>
  );
}
