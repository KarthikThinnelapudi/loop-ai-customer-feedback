"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Modal from "@/components/common/Modal";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  Trash2,
  FileText,
  Radio,
  Play,
  Pause,
  Square,
  Sparkles,
} from "lucide-react";

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  content: string;
  channel?: "SUPPORT_TICKET" | "APP_STORE_REVIEW" | "NPS_SURVEY" | "SALES_CALL_NOTE" | "COMMUNITY_POST";
  customerName?: string;
  customerEmail?: string;
  company?: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rating?: number;
}

interface SingleEntryForm {
  customerName: string;
  customerEmail: string;
  company: string;
  channel: "SUPPORT_TICKET" | "APP_STORE_REVIEW" | "NPS_SURVEY" | "SALES_CALL_NOTE" | "COMMUNITY_POST";
  rating: number;
  content: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const mockStreamItems: ParsedRow[] = [
  {
    content: "Onboarding took over 45 minutes because team invite tokens expired prematurely.",
    channel: "SUPPORT_TICKET",
    customerName: "Sarah Jenkins (Stripe)",
    customerEmail: "sarah@stripe.com",
    company: "Stripe",
    category: "UX",
    priority: "CRITICAL",
    rating: 1,
  },
  {
    content: "The new dashboard is gorgeous and page load latency is sub-50ms. Fantastic update!",
    channel: "APP_STORE_REVIEW",
    customerName: "David K. (Linear)",
    customerEmail: "david@linear.app",
    company: "Linear",
    category: "Performance",
    priority: "LOW",
    rating: 5,
  },
  {
    content: "Enterprise prospect requires Okta SSO SAML 2.0 before signing the annual tier.",
    channel: "SALES_CALL_NOTE",
    customerName: "Alex Vance (Vercel)",
    customerEmail: "alex@vercel.com",
    company: "Vercel",
    category: "Feature Request",
    priority: "HIGH",
    rating: 4,
  },
  {
    content: "CSV invoice PDF download button timed out twice during quarterly finance audit.",
    channel: "SUPPORT_TICKET",
    customerName: "Elena R. (Datadog)",
    customerEmail: "elena@datadog.com",
    company: "Datadog",
    category: "Billing",
    priority: "HIGH",
    rating: 2,
  },
  {
    content: "Asking LOOP AI grounded questions returns accurate answers with zero hallucination.",
    channel: "NPS_SURVEY",
    customerName: "Michael T. (Snowflake)",
    customerEmail: "michael@snowflake.com",
    company: "Snowflake",
    category: "General",
    priority: "LOW",
    rating: 5,
  },
];

export default function CSVUploadModal({ isOpen, onClose, onSuccess }: CSVUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"bulk" | "single" | "stream">("bulk");

  // Tab 1: CSV Bulk Upload State
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>("Uploading...");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 2: Single Entry Form State
  const [singleForm, setSingleForm] = useState<SingleEntryForm>({
    customerName: "",
    customerEmail: "",
    company: "",
    channel: "SUPPORT_TICKET",
    rating: 5,
    content: "",
    category: "General",
    priority: "MEDIUM",
  });
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleSuccess, setSingleSuccess] = useState<string | null>(null);

  // Tab 3: Simulate Stream State
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);
  const [streamedCount, setStreamedCount] = useState(0);
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearSelection = () => {
    setFile(null);
    setParsedRows([]);
    setDetectedColumns([]);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // CSV Validation & Parser Engine
  const processFile = (selected: File) => {
    setError(null);
    setSuccessMessage(null);

    // 1. File Extension & MIME Type Check
    const isCSV = selected.name.toLowerCase().endsWith(".csv") || selected.type === "text/csv";
    if (!isCSV) {
      setError("Invalid file type. Only .csv files are accepted. (Images, PDFs, Excel, and ZIP files are rejected).");
      clearSelection();
      return;
    }

    // 2. Strict 6 MB Size Limit Check
    const MAX_SIZE = 6 * 1024 * 1024; // 6 MB
    if (selected.size > MAX_SIZE) {
      setError(`File size exceeds strict 6 MB limit. Selected file size: ${(selected.size / (1024 * 1024)).toFixed(2)} MB.`);
      clearSelection();
      return;
    }

    setFile(selected);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseCSVText(text);
    };
    reader.readAsText(selected);
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setError("The selected CSV file is empty. Please select a valid CSV with feedback headers.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
    setDetectedColumns(headers);

    const contentIdx = headers.findIndex((h) => h.includes("content") || h.includes("quote") || h.includes("feedback") || h.includes("text"));
    const channelIdx = headers.findIndex((h) => h.includes("channel"));
    const customerIdx = headers.findIndex((h) => h.includes("customer") || h.includes("label") || h.includes("author") || h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const companyIdx = headers.findIndex((h) => h.includes("company"));
    const categoryIdx = headers.findIndex((h) => h.includes("category"));
    const priorityIdx = headers.findIndex((h) => h.includes("priority"));
    const ratingIdx = headers.findIndex((h) => h.includes("rating"));

    const rows: ParsedRow[] = [];
    const seenContent = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const cols = line.match(/(?:[^\s,"]|"(?:\\.|[^"])*")+/g) || line.split(",");
      const cleanedCols = cols.map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const content = contentIdx !== -1 ? cleanedCols[contentIdx] : cleanedCols[0];
      if (!content || content.length < 3) continue;

      // Duplicate row filtering
      const contentLower = content.toLowerCase();
      if (seenContent.has(contentLower)) continue;
      seenContent.add(contentLower);

      const rawChannel = channelIdx !== -1 ? cleanedCols[channelIdx]?.toUpperCase() : "SUPPORT_TICKET";
      const validChannels = ["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"];
      const channel = validChannels.includes(rawChannel) ? (rawChannel as ParsedRow["channel"]) : "SUPPORT_TICKET";

      const rawPriority = priorityIdx !== -1 ? cleanedCols[priorityIdx]?.toUpperCase() : "MEDIUM";
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      const priority = validPriorities.includes(rawPriority) ? (rawPriority as ParsedRow["priority"]) : "MEDIUM";

      rows.push({
        content,
        channel,
        customerName: customerIdx !== -1 ? cleanedCols[customerIdx] : "CSV Customer",
        customerEmail: emailIdx !== -1 ? cleanedCols[emailIdx] : "customer@external.com",
        company: companyIdx !== -1 ? cleanedCols[companyIdx] : "Enterprise Account",
        category: categoryIdx !== -1 ? cleanedCols[categoryIdx] : "General",
        priority,
        rating: ratingIdx !== -1 ? parseInt(cleanedCols[ratingIdx], 10) || 5 : 5,
      });
    }

    if (rows.length === 0) {
      setError("No valid feedback rows detected. Ensure CSV contains a content or quote column.");
      setParsedRows([]);
    } else {
      setError(null);
      setParsedRows(rows);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) processFile(selected);
  };

  // Unified CSV Bulk Upload Dispatcher
  const handleBulkUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsUploading(true);
    setError(null);
    setUploadStage("Parsing CSV Rows...");
    setUploadProgress(20);

    try {
      setUploadStage("Saving to Database...");
      setUploadProgress(50);

      const res = await fetch("/api/feedback/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedRows }),
      });

      setUploadStage("Running AI Classification...");
      setUploadProgress(85);

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to import feedback CSV.");
      }

      setUploadStage("Completed");
      setUploadProgress(100);
      setSuccessMessage(`Successfully imported ${result.importedCount} records (${result.duplicateCount || 0} duplicates skipped).`);

      setTimeout(() => {
        setIsUploading(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setIsUploading(false);
      setError(err instanceof Error ? err.message : "Error uploading CSV.");
    }
  };

  // Single Entry Form Submission
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.customerName || !singleForm.customerEmail || !singleForm.content) {
      setSingleError("Customer name, work email, and feedback quote are required.");
      return;
    }

    setIsSubmittingSingle(true);
    setSingleError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: singleForm.customerName,
          customerEmail: singleForm.customerEmail,
          company: singleForm.company || "Enterprise Account",
          channel: singleForm.channel,
          rating: singleForm.rating,
          content: singleForm.content,
          category: singleForm.category,
          priority: singleForm.priority,
          status: "NEW",
          source: "Single Entry Form",
          product: "LOOP AI",
        }),
      });

      const result = await res.json();
      setIsSubmittingSingle(false);

      if (!res.ok) {
        throw new Error(result.message || "Failed to create feedback record.");
      }

      setSingleSuccess("Feedback record submitted successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setIsSubmittingSingle(false);
      setSingleError(err instanceof Error ? err.message : "Error submitting feedback.");
    }
  };

  // Simulated Live Channel Streaming
  const startStreaming = () => {
    setIsStreaming(true);
    setIsPaused(false);
    setStreamProgress(0);
    setStreamedCount(0);
    runStreamLoop(0);
  };

  const runStreamLoop = (index: number) => {
    if (index >= mockStreamItems.length) {
      setIsStreaming(false);
      onSuccess();
      return;
    }

    const currentItem = mockStreamItems[index];

    fetch("/api/feedback/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [currentItem] }),
    }).catch(() => {});

    setStreamedCount(index + 1);
    setStreamProgress(Math.round(((index + 1) / mockStreamItems.length) * 100));

    const delay = Math.max(300, 2000 / streamSpeed);
    streamTimerRef.current = setTimeout(() => {
      runStreamLoop(index + 1);
    }, delay);
  };

  const pauseStream = () => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    setIsPaused(true);
  };

  const stopStream = () => {
    if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    setIsStreaming(false);
    setIsPaused(false);
    setStreamProgress(0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ingest Customer Feedback">
      <div className="space-y-5 text-slate-300">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "bulk"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>CSV Bulk Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "single"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Single Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stream")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "stream"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Simulate Channel Stream</span>
          </button>
        </div>

        {/* TAB 1: CSV BULK UPLOAD (CONSOLIDATED SHARED PIPELINE) */}
        {activeTab === "bulk" && (
          <div className="space-y-5">
            {/* Hidden File Input */}
            <input
              type="file"
              accept=".csv,text/csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag & Drop Zone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="CSV file dropzone"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-7 rounded-2xl border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDragOver ? "border-emerald-400 bg-emerald-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"
              }`}
            >
              <UploadCloud className="w-9 h-9 text-emerald-400 mb-2.5 animate-bounce" />
              <p className="text-sm font-semibold text-white mb-2">
                {file ? file.name : "Drag & Drop your CSV file here"}
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs hover:bg-slate-800 transition shadow-sm"
              >
                Browse Files
              </button>

              <p className="text-xs text-slate-400 mt-3">
                Supported format: <code className="font-mono text-emerald-400">.csv</code> (Maximum file size: <strong>6 MB</strong>)
              </p>
            </div>

            {/* Validation & Preview Card */}
            {file && parsedRows.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>{file.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-slate-500 hover:text-rose-400 transition"
                    title="Clear selected file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                  ✓ CSV Valid • {parsedRows.length} rows • {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Upload
                </div>
              </div>
            )}

            {/* Error / Success Alerts */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{uploadStage}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  clearSelection();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={parsedRows.length === 0 || isUploading}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Upload {parsedRows.length} Feedback Rows</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SINGLE ENTRY FORM */}
        {activeTab === "single" && (
          <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
            {singleError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            {singleSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{singleSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={singleForm.customerName}
                  onChange={(e) => setSingleForm({ ...singleForm, customerName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Customer Email *</label>
                <input
                  type="email"
                  required
                  value={singleForm.customerEmail}
                  onChange={(e) => setSingleForm({ ...singleForm, customerEmail: e.target.value })}
                  placeholder="sarah@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Company</label>
                <input
                  type="text"
                  value={singleForm.company}
                  onChange={(e) => setSingleForm({ ...singleForm, company: e.target.value })}
                  placeholder="Stripe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Channel</label>
                <select
                  value={singleForm.channel}
                  onChange={(e) => setSingleForm({ ...singleForm, channel: e.target.value as SingleEntryForm["channel"] })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="SUPPORT_TICKET">SUPPORT TICKET</option>
                  <option value="APP_STORE_REVIEW">APP STORE REVIEW</option>
                  <option value="NPS_SURVEY">NPS SURVEY</option>
                  <option value="SALES_CALL_NOTE">SALES CALL NOTE</option>
                  <option value="COMMUNITY_POST">COMMUNITY POST</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={singleForm.rating}
                  onChange={(e) => setSingleForm({ ...singleForm, rating: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-semibold text-slate-400">Feedback Quote / Content *</label>
                <span className="text-[10px] text-slate-500 font-mono">{singleForm.content.length} chars</span>
              </div>
              <textarea
                required
                rows={3}
                value={singleForm.content}
                onChange={(e) => setSingleForm({ ...singleForm, content: e.target.value })}
                placeholder="Enter full customer quote or feedback details..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={singleForm.category}
                  onChange={(e) => setSingleForm({ ...singleForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="General">General</option>
                  <option value="UX">UX / Onboarding</option>
                  <option value="Performance">Performance</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Billing">Billing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Priority</label>
                <select
                  value={singleForm.priority}
                  onChange={(e) => setSingleForm({ ...singleForm, priority: e.target.value as SingleEntryForm["priority"] })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-semibold hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSingle}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingSingle && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Feedback Record</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SIMULATE CHANNEL STREAM */}
        {activeTab === "stream" && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Live Channel Streaming Simulator</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">Speed:</span>
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setStreamSpeed(spd)}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                        streamSpeed === spd ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-slate-400 text-xs">
                Simulate real-time streaming ingestion across Support Tickets, App Store Reviews, and Sales Call Notes with instant AI sentiment updates.
              </p>

              {/* Progress & Queue Status */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between font-mono text-[11px] text-slate-400">
                  <span>Streamed: {streamedCount} / {mockStreamItems.length} items</span>
                  <span>{streamProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${streamProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Live Controls */}
            <div className="flex items-center justify-center gap-3 py-2">
              {!isStreaming ? (
                <button
                  type="button"
                  onClick={startStreaming}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start Live Stream</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaused(false);
                        runStreamLoop(streamedCount);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseStream}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition flex items-center gap-1.5"
                    >
                      <Pause className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopStream}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold transition flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-300" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Streamed records are automatically auto-tagged by AI and reflected on your dashboard in real time.</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
