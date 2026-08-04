"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import Modal from "@/components/common/Modal";
import {
  FileText,
  Sparkles,
  Share2,
  CheckCircle2,
  Printer,
  Trash2,
  Loader2,
  ShieldAlert,
  Copy,
  ExternalLink,
} from "lucide-react";
import { hasPermission } from "@/lib/rbac";

interface ReportItem {
  id: string;
  title: string;
  summary: string;
  totalItems: number;
  avgSentiment: number;
  pdfUrl?: string | null;
  createdAt: string;
  author?: { name: string; email: string };
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role?.toUpperCase() || "VIEWER";

  const canGenerate = hasPermission(userRole, "reports:generate");
  const canDeleteReport = hasPermission(userRole, "users:manage"); // Admin/Owner only
  const canShareReport = hasPermission(userRole, "reports:share");

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Share Modal State
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReports = () => {
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setReports(data);
          if (data.length > 0) setSelectedReport(data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to generate report.");
      }

      fetchReports();
      setSelectedReport(result);
      setShowGenerateModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating report.");
    } fontally: {
      setGenerating(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!selectedReport || !canShareReport) return;
    setSharing(true);
    setGeneratedShareUrl(null);
    try {
      const res = await fetch("/api/reports/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          expiresInDays,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to create share link.");
      }

      setGeneratedShareUrl(result.shareUrl);

      // Web Share API fallback if supported
      if (navigator.share) {
        navigator.share({
          title: selectedReport.title,
          url: result.shareUrl,
        }).catch(() => {});
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate link.");
    } finally {
      setSharing(false);
    }
  };

  const handleCopyShareLink = () => {
    if (!generatedShareUrl) return;
    navigator.clipboard.writeText(generatedShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteReport = async (id: string) => {
    if (!canDeleteReport) return;
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || "Failed to delete report.");
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(reports.find((r) => r.id !== id) || null);
      }
    } catch {
      alert("Error deleting report.");
    }
  };

  return (
    <DashboardLayout>
      {/* Read-Only Notice Banner for Viewer Role */}
      {userRole === "VIEWER" && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>You are viewing in <strong>READ-ONLY</strong> mode (Viewer Role). Report generation and deletion controls are disabled.</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-emerald-400" />
            <span>Voice-of-Customer (VoC) Reports</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Database-aggregated VoC summaries and AI executive narrative digests
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canGenerate && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate 1-Click VoC Digest</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading Voice-of-Customer Reports...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Reports Sidebar */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Saved Reports History ({reports.length})
            </h3>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 border border-slate-800 rounded-xl bg-slate-950">
                No reports saved yet. Click &quot;Generate 1-Click VoC Digest&quot; to synthesize your first report.
              </p>
            ) : (
              reports.map((rep) => {
                const isSelected = selectedReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-slate-900 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                        : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{rep.title}</h4>
                      {canDeleteReport && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(rep.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 transition"
                          title="Delete Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-emerald-400 font-semibold">
                        {(rep.avgSentiment * 100).toFixed(0)}% Positive
                      </span>
                      <span className="text-slate-500">{rep.totalItems} items</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Report Preview Screen */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <Card className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{selectedReport.title}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Author: {selectedReport.author?.name || "System"} • Created: {new Date(selectedReport.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print PDF</span>
                    </button>

                    {canShareReport && (
                      <button
                        onClick={() => {
                          setGeneratedShareUrl(null);
                          setShowShareModal(true);
                        }}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share Digest</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase font-mono">Feedback Evaluated</span>
                    <p className="text-xl font-bold text-white mt-1">{selectedReport.totalItems} Items</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase font-mono">Net Sentiment Score</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                      {(selectedReport.avgSentiment * 100).toFixed(0)}% Positive
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    AI Executive Narrative Synthesis
                  </h3>
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-sm leading-relaxed">
                    {selectedReport.summary}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-2">
                  <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Recommended Roadmap Action
                  </h3>
                  <p className="text-xs text-slate-300">
                    Prioritize latency resolution and continue monitoring customer onboarding sentiment trends.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-slate-400">Select a report to view details.</Card>
            )}
          </div>
        </div>
      )}

      {/* Share Digest Modal */}
      {showShareModal && selectedReport && (
        <Modal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Share Executive VoC Digest"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <p>
              Generate a cryptographically secure token link for <strong>{selectedReport.title}</strong>. Internal database IDs and administrative settings will be hidden.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Link Expiration
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>24 Hours</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={0}>Never (Admin Only)</option>
              </select>
            </div>

            {generatedShareUrl ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 font-mono text-xs">
                  <span className="truncate text-emerald-400">{generatedShareUrl}</span>
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={generatedShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition text-center flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Public Share Link</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateShareLink}
                  disabled={sharing}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {sharing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Secure Link</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Generate Report Modal */}
      {canGenerate && (
        <Modal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          title="Generate Voice-of-Customer Report"
        >
          <div className="space-y-4 text-xs text-slate-300">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {error}
              </div>
            )}

            <p>
              Clicking &quot;Generate Report&quot; will query all customer feedback items in your workspace database, aggregate sentiment metrics, and generate an AI executive narrative digest.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition flex items-center gap-2 disabled:opacity-50"
              >
                {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{generating ? "Synthesizing Report..." : "Generate Report"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
