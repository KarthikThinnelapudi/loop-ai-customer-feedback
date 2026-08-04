import { db } from "@/lib/db";
import { FileText, Sparkles, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import LoopLogo from "@/app/components/logo/LoopLogo";

export const revalidate = 0; // Dynamic route

export default async function PublicReportSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const shareLink = await db.shareLink.findUnique({
    where: { token },
    include: {
      report: true,
      workspace: { select: { name: true, logo: true, industry: true } },
    },
  });

  if (!shareLink || shareLink.revoked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Report Access Unavailable</h1>
        <p className="text-sm text-slate-400 max-w-md">
          This shared report link is invalid, revoked, or no longer available. Please contact the workspace administrator for an updated link.
        </p>
      </div>
    );
  }

  // Check Expiration (410 Gone)
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Share Link Expired (410 Gone)</h1>
        <p className="text-sm text-slate-400 max-w-md">
          This security link expired on {new Date(shareLink.expiresAt).toLocaleDateString()}. Please request a fresh digest link from the report creator.
        </p>
      </div>
    );
  }

  // Increment access count
  await db.shareLink.update({
    where: { id: shareLink.id },
    data: { accessCount: { increment: 1 } },
  });

  const { report, workspace } = shareLink;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Branding Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <LoopLogo />
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified Public Digest
            </span>
          </div>

          <div className="text-right">
            <h3 className="text-sm font-bold text-white">{workspace.name}</h3>
            <p className="text-xs text-slate-500 font-mono">{workspace.industry || "Enterprise SaaS"}</p>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <FileText className="w-7 h-7 text-emerald-400" />
                <span>{report.title}</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Generated: {new Date(report.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure Shared Report</span>
              </span>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">Total Customer Feedback</span>
              <p className="text-2xl font-extrabold text-white mt-1">{report.totalItems} Items</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">Net Positive Sentiment</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                {(report.avgSentiment * 100).toFixed(0)}% Positive
              </p>
            </div>
          </div>

          {/* Executive Narrative */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Executive Voice-of-Customer Narrative
            </h3>
            <p className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-sm leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Roadmap Recommendation */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-950 to-slate-950 border border-emerald-500/30 space-y-2">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Strategic Roadmap Action
            </h3>
            <p className="text-xs text-slate-300">
              Address identified onboarding latency and API integration feedback to maximize customer retention and expansion.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 font-mono pt-4">
          Powered by LOOP AI Customer Feedback Intelligence Platform • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
