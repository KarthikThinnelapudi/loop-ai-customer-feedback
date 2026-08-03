"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Modal from "@/components/common/Modal";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";


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
}

export default function CSVUploadModal({ isOpen, onClose, onSuccess }: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setError("The selected CSV file is empty.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
    const contentIdx = headers.findIndex((h) => h.includes("content") || h.includes("quote") || h.includes("feedback"));
    const channelIdx = headers.findIndex((h) => h.includes("channel"));
    const customerIdx = headers.findIndex((h) => h.includes("customer") || h.includes("label") || h.includes("author"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Basic CSV regex split supporting quoted values
      const cols = line.match(/(?:[^\s,"]|"(?:\\.|[^"])*")+/g) || line.split(",");
      const cleanedCols = cols.map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const content = contentIdx !== -1 ? cleanedCols[contentIdx] : cleanedCols[0];
      if (!content || content.length < 5) continue;

      const rawChannel = channelIdx !== -1 ? cleanedCols[channelIdx]?.toUpperCase() : "SUPPORT_TICKET";
      const validChannels = ["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"];
      const channel = validChannels.includes(rawChannel) ? (rawChannel as ParsedRow["channel"]) : "SUPPORT_TICKET";

      rows.push({
        content,
        channel,
        customerName: customerIdx !== -1 ? cleanedCols[customerIdx] : "CSV Import",
        customerEmail: emailIdx !== -1 ? cleanedCols[emailIdx] : "import@external.com",
      });
    }

    if (rows.length === 0) {
      setError("No valid feedback content quotes found in CSV.");
      setParsedRows([]);
    } else {
      setError(null);
      setParsedRows(rows);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (evt) => parseCSVText(evt.target?.result as string);
    reader.readAsText(selected);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (evt) => parseCSVText(evt.target?.result as string);
    reader.readAsText(selected);
  };

  const handleUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress(25);

    try {
      setUploadProgress(60);
      const res = await fetch("/api/feedback/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedRows }),
      });

      setUploadProgress(90);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to import feedback CSV.");
      }

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
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center ${
            isDragOver ? "border-emerald-400 bg-emerald-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"
          }`}
        >
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-emerald-400 mb-3 animate-bounce" />
          <p className="text-sm font-semibold text-white">
            {file ? file.name : "Click to Browse Files or drag & drop CSV here"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supported columns: <code className="font-mono text-emerald-400">content, channel, customer_label, created_at</code>
          </p>
        </div>

        {/* Status & Error Alerts */}
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

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Uploading Feedback Quotes...</span>
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

        {/* Parsed Rows Preview */}
        {parsedRows.length > 0 && !isUploading && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Preview Parsed Rows ({parsedRows.length})</span>
              <span className="text-emerald-400 font-mono text-[11px]">Ready for Ingestion</span>
            </p>
            <div className="max-h-36 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-900 text-xs p-3">
              {parsedRows.slice(0, 5).map((r, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-4">
                  <span className="truncate italic text-slate-300">&quot;{r.content}&quot;</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                    {r.channel}
                  </span>
                </div>
              ))}
              {parsedRows.length > 5 && (
                <p className="text-[10px] text-slate-500 pt-2 text-center">
                  + {parsedRows.length - 5} more feedback rows
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
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
