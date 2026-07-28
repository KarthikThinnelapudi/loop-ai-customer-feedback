"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import Modal from "@/components/common/Modal";
import {
  FileText,
  Sparkles,
  Share2,
  CheckCircle2,
  Printer,
} from "lucide-react";


interface ReportItem {
  id: string;
  title: string;
  period: string;
  createdAt: string;
  totalFeedback: number;
  sentimentScore: string;
  topTheme: string;
  summary: string;
  recommendation: string;
}

const savedReports: ReportItem[] = [
  {
    id: "rep-1",
    title: "Weekly Executive Voice-of-Customer Digest",
    period: "Jul 21 - Jul 28, 2026",
    createdAt: "2026-07-28 18:00",
    totalFeedback: 548,
    sentimentScore: "+82.4% Positive",
    topTheme: "Onboarding Friction (+62%)",
    summary:
      "Customer sentiment rose 6.4% week-over-week driven by praise for the v2 dashboard performance release. However, onboarding team invitation latency has spiked by +62%, forming the single primary friction point across support tickets.",
    recommendation:
      "Prioritize fix for invitation flow timeouts in Sprint 42 to protect user activation rates.",
  },
  {
    id: "rep-2",
    title: "Q2 Enterprise Feature Request Synthesis",
    period: "Apr 01 - Jun 30, 2026",
    createdAt: "2026-07-01 09:00",
    totalFeedback: 2140,
    sentimentScore: "+76.0% Positive",
    topTheme: "SSO SAML Authentication",
    summary:
      "Enterprise prospects consistently cite Okta and SAML 2.0 single sign-on as a mandatory requirement before closing annual contracts.",
    recommendation:
      "Accelerate Okta integration to unblock $180k in ARR pipeline.",
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(savedReports);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(savedReports[0]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState("Last 7 Days");

  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      const newRep: ReportItem = {
        id: `rep-${Date.now()}`,
        title: `VoC Executive Digest (${dateRange})`,
        period: `${dateRange} - ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toLocaleString(),
        totalFeedback: 120,
        sentimentScore: "+85.0% Positive",
        topTheme: "Dashboard Speed (+40%)",
        summary:
          "Pre-computed statistics confirm a 40% volume spike in dashboard performance praises. Negative sentiment remains localized to PDF billing download timeouts.",
        recommendation: "Patch billing timeout endpoint in upcoming minor release.",
      };

      setReports([newRep, ...reports]);
      setSelectedReport(newRep);
      setGenerating(false);
      setShowGenerateModal(false);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-emerald-400" />
            <span>Voice-of-Customer (VoC) Reports</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pre-calculated statistical digests synthesized with AI executive narratives
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 1-Click VoC Digest</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Reports Sidebar */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Saved Reports History ({reports.length})
          </h3>

          {reports.map((rep) => {
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
                  <span className="text-[10px] text-slate-500 font-mono">{rep.createdAt}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{rep.period}</p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-emerald-400 font-semibold">{rep.sentimentScore}</span>
                  <span className="text-slate-500">{rep.totalFeedback} items</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Report Preview Screen */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <Card className="space-y-6">
              {/* Report Action Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{selectedReport.title}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">Period: {selectedReport.period}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print PDF</span>
                  </button>
                  <button className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" />
                    <span>Share Digest</span>
                  </button>
                </div>
              </div>

              {/* Pre-Computed Stats Bar */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-mono">Feedback Evaluated</span>
                  <p className="text-xl font-bold text-white mt-1">{selectedReport.totalFeedback} Items</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-mono">Net Sentiment</span>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{selectedReport.sentimentScore}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-mono">Primary Spike Theme</span>
                  <p className="text-xl font-bold text-teal-300 mt-1">{selectedReport.topTheme}</p>
                </div>
              </div>

              {/* AI Narrative Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  AI Executive Narrative Synthesis
                </h3>
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-sm leading-relaxed">
                  {selectedReport.summary}
                </div>
              </div>

              {/* AI Strategic Recommendation */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-2">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Recommended Roadmap Action
                </h3>
                <p className="text-xs text-slate-300">{selectedReport.recommendation}</p>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400">Select a report to view details.</Card>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Voice-of-Customer Report"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Time Window
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="Last 7 Days">Last 7 Days (Weekly Digest)</option>
              <option value="Last 30 Days">Last 30 Days (Monthly Overview)</option>
              <option value="Quarter To Date">Quarter To Date (Q2 Executive Review)</option>
            </select>
          </div>

          <p className="text-xs text-slate-400">
            Our server will pre-compute exact sentiment deltas and theme frequencies first, then ask Claude AI to synthesize the executive summary around those numbers.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowGenerateModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {generating ? "Synthesizing Narrative..." : "Generate Report"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
