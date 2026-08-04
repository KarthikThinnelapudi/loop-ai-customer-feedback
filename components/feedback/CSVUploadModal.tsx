"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Modal from "@/components/common/Modal";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FileCode, Trash2 } from "lucide-react";

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

export default function CSVUploadModal({ isOpen, onClose, onSuccess }: CSVUploadModalProps) {
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

  const processFile = (selected: File) => {
    setError(null);
    setSuccessMessage(null);

    // 1. File Extension Validation
    const isCSV = selected.name.toLowerCase().endsWith(".csv") || selected.type === "text/csv";
    if (!isCSV) {
      setError("Invalid file type. Only .csv files are supported (Excel, PDF, ZIP, and images are rejected).");
      clearSelection();
      return;
    }

    // 2. File Size Validation (Max 20 MB)
    const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
    if (selected.size > MAX_SIZE) {
      setError("File size exceeds 20 MB limit. Please select a smaller CSV file.");
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
      setError("The selected CSV file is empty.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
    setDetectedColumns(headers);

    const contentIdx = headers.findIndex((h) => h.includes("content") || h.includes("quote") || h.includes("feedback"));
    const channelIdx = headers.findIndex((h) => h.includes("channel"));
    const customerIdx = headers.findIndex((h) => h.includes("customer") || h.includes("label") || h.includes("author") || h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const companyIdx = headers.findIndex((h) => h.includes("company"));
    const categoryIdx = headers.findIndex((h) => h.includes("category"));
    const priorityIdx = headers.findIndex((h) => h.includes("priority"));
    const ratingIdx = headers.findIndex((h) => h.includes("rating"));

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const cols = line.match(/(?:[^\s,"]|"(?:\\.|[^"])*")+/g) || line.split(",");
      const cleanedCols = cols.map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const content = contentIdx !== -1 ? cleanedCols[contentIdx] : cleanedCols[0];
      if (!content || content.length < 5) continue;

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
      setError("No valid feedback rows found. Please ensure CSV contains a feedback content column.");
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

  const handleUpload = async () => {
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
      setSuccessMessage(`Successfully imported ${result.importedCount} items (${result.duplicateCount} duplicates skipped).`);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Customer Feedback CSV">
      <div className="space-y-6 text-slate-300">
        {/* Hidden File Input */}
        <input
          type="file"
          accept=".csv,text/csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Drag and Drop Zone */}
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
          className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            isDragOver ? "border-emerald-400 bg-emerald-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"
          }`}
        >
          <UploadCloud className="w-10 h-10 text-emerald-400 mb-3 animate-bounce" />
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
            Supported format: <code className="font-mono text-emerald-400">.csv</code> (Max size: 20 MB)
          </p>
        </div>


        {/* Selected File Details & Preview Header */}
        {file && parsedRows.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>{file.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  ({(file.size / 1024).toFixed(1)} KB)
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

            <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
              <div>Rows Detected: <strong className="text-emerald-400">{parsedRows.length}</strong></div>
              <div>Columns: <strong className="text-emerald-400">{detectedColumns.length}</strong></div>
              <div>Status: <strong className="text-emerald-400">Validated</strong></div>
            </div>
          </div>
        )}

        {/* Status Alerts */}
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

        {/* Parsed Rows Preview Table */}
        {parsedRows.length > 0 && !isUploading && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Preview First 10 Rows</span>
              <span className="text-emerald-400 font-mono text-[11px]">Ready for Ingestion</span>
            </p>
            <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-900 text-xs p-3">
              {parsedRows.slice(0, 10).map((r, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-4">
                  <span className="truncate italic text-slate-300">&quot;{r.content}&quot;</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                    {r.channel}
                  </span>
                </div>
              ))}
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
            onClick={handleUpload}
            disabled={parsedRows.length === 0 || isUploading}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-2"
          >
            {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Upload {parsedRows.length} Feedback Rows</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
