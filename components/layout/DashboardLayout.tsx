"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumb from "./Breadcrumb";
import Modal from "../common/Modal";
import SessionTimeoutModal from "../auth/SessionTimeoutModal";
import { Sparkles, Upload } from "lucide-react";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestType, setIngestType] = useState<"single" | "csv" | "simulated">("single");
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState("SUPPORT_TICKET");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowIngestModal(false);
        setContent("");
      }, 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex relative overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar onOpenNewFeedback={() => setShowIngestModal(true)} />

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6">
          <Breadcrumb />
          {children}
        </main>
      </div>

      {/* Ingest Feedback Modal */}
      <Modal
        isOpen={showIngestModal}
        onClose={() => setShowIngestModal(false)}
        title="Ingest Customer Feedback"
      >
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-800 pb-3 gap-4 text-xs font-semibold">
            <button
              onClick={() => setIngestType("single")}
              className={`pb-2 border-b-2 transition ${
                ingestType === "single"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Single Entry
            </button>
            <button
              onClick={() => setIngestType("csv")}
              className={`pb-2 border-b-2 transition ${
                ingestType === "csv"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              CSV Bulk Upload
            </button>
            <button
              onClick={() => setIngestType("simulated")}
              className={`pb-2 border-b-2 transition ${
                ingestType === "simulated"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Simulate Channel Stream
            </button>
          </div>

          {success ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold">
                ✓
              </div>
              <h4 className="text-lg font-bold text-white">Feedback Queued for AI Classification!</h4>
              <p className="text-xs text-slate-400">
                Item parsed and stored. Sentiment scoring and theme clustering triggered in background.
              </p>
            </div>
          ) : ingestType === "single" ? (
            <form onSubmit={handleIngest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Feedback Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="SUPPORT_TICKET">Support Ticket / Intercom</option>
                  <option value="APP_STORE_REVIEW">App Store / Play Store Review</option>
                  <option value="NPS_SURVEY">NPS Free-Text Survey</option>
                  <option value="SALES_CALL_NOTE">Sales & Success Call Note</option>
                  <option value="COMMUNITY_POST">Community Post / Discord</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Customer Quote Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste raw customer feedback text here..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {loading ? "Processing..." : "Submit & Run AI Tagging"}
                </button>
              </div>
            </form>
          ) : ingestType === "csv" ? (
            <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-3 hover:border-emerald-500/50 transition cursor-pointer">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-200">Drag & Drop CSV File Here</p>
              <p className="text-xs text-slate-500">Columns supported: content, channel, customer_label, created_at</p>
              <button className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-200 rounded-xl hover:bg-slate-700 transition">
                Browse Files
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Click below to simulate streaming 25 realistic multi-channel feedback records into your workspace for instant demoing.
              </p>
              <button
                onClick={handleIngest}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Inject 25 Simulated Integration Items</span>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
