"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Upload, FileText } from "lucide-react";


const industries = ["SaaS / Software", "E-Commerce", "Fintech", "Developer Tools", "Healthcare", "EdTech", "Agency / Services"];
const teamSizes = ["1-10 Employees", "11-50 Employees", "51-200 Employees", "200+ Enterprise"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("SaaS / Software");
  const [teamSize, setTeamSize] = useState("11-50 Employees");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
          description,
          industry,
          teamSize,
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
      className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-[0_0_80px_rgba(16,185,129,0.12)] relative"
    >
      {/* Top Floating AI Element */}
      <div className="absolute -top-5 right-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 rounded-full font-mono flex items-center gap-1.5 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span>Multi-Tenant AI Workspace</span>
      </div>

      <div className="text-center mb-6 pt-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {step === 1 ? "Create Workspace" : "Admin Account Setup"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === 1
            ? "Step 1 of 2: Configure your tenant organization"
            : "Step 2 of 2: Create your Workspace Admin credentials"}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className={`h-2 w-full rounded-full transition-colors ${step >= 1 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-800"}`} />
          <span className="text-[10px] font-mono uppercase text-slate-400">1. Workspace</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className={`h-2 w-full rounded-full transition-colors ${step >= 2 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-800"}`} />
          <span className="text-[10px] font-mono uppercase text-slate-400">2. Admin User</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 ? (
          <>
            {/* Logo Upload Avatar */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {logoPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                ) : (

                  <Building className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white mb-1">Workspace Brand Logo</p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo (Optional)</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Workspace Name <span className="text-emerald-400">*</span>
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Description & Products
              </label>
              <div className="relative">
                <FileText className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what your product does (helps AI classification context)..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Team Size
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {teamSizes.map((ts) => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Admin Full Name
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

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
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
                <span>{step === 1 ? "Continue to Admin Setup" : "Create Workspace"}</span>
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

