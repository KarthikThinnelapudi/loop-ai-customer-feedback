"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Breadcrumb from "./Breadcrumb";
import Modal from "../common/Modal";
import SessionTimeoutModal from "../auth/SessionTimeoutModal";
import CSVUploadModal from "../feedback/CSVUploadModal";
import FeedbackModal from "../feedback/FeedbackModal";
import { Sparkles } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);

  const [ingestType, setIngestType] = useState<"single" | "csv" | "simulated">("single");
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
      }, 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex relative overflow-x-hidden">
      {/* Session Inactivity Warning Modal */}
      <SessionTimeoutModal />

      {/* Responsive Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar with Mobile Navigation Trigger */}
        <Topbar
          onOpenNewFeedback={() => setShowIngestModal(true)}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
          <Breadcrumb />
          {children}
        </main>
      </div>

      {/* Ingest Feedback Selection Modal */}
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
              onClick={() => {
                setShowIngestModal(false);
                setShowCsvModal(true);
              }}
              className="pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition"
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
              Simulate Stream
            </button>
          </div>

          {success ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold">
                ✓
              </div>
              <h4 className="text-lg font-bold text-white">Feedback Ingestion Complete</h4>
              <p className="text-xs text-slate-400">
                Item parsed and stored. Sentiment scoring and theme clustering updated in real-time.
              </p>
            </div>
          ) : ingestType === "single" ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Add a single raw customer feedback quote from support tickets, app store reviews, or sales call notes.
              </p>
              <button
                onClick={() => {
                  setShowIngestModal(false);
                  setShowSingleModal(true);
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition"
              >
                Open Single Entry Form
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Simulate streaming multi-channel customer feedback records into your active workspace.
              </p>
              <button
                onClick={handleIngest}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? "Ingesting..." : "Simulate Stream Items"}</span>
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Consolidated CSV Modal */}
      <CSVUploadModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onSuccess={() => {}}
      />

      {/* Manual Single Entry Modal */}
      <FeedbackModal
        isOpen={showSingleModal}
        onClose={() => setShowSingleModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
