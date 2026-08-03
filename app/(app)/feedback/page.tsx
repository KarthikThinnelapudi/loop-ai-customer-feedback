"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";
import {
  Inbox,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import CSVUploadModal from "@/components/feedback/CSVUploadModal";


interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  customerLabel: string;
  sentiment: "POS" | "NEU" | "NEG";
  sentimentScore: number;
  status: "NEW" | "REVIEWED" | "ACTIONED";
  featureArea: string;
  themes: string[];
  createdAt: string;
  rationale: string;
}

const mockFeedbackData: FeedbackItem[] = [
  {
    id: "fb-101",
    content: "Onboarding took forever — I couldn't figure out how to invite my team. The docs were outdated.",
    channel: "SUPPORT_TICKET",
    customerLabel: "Sarah J. (Stripe)",
    sentiment: "NEG",
    sentimentScore: -0.85,
    status: "NEW",
    featureArea: "Onboarding",
    themes: ["Onboarding Friction", "Documentation"],
    createdAt: "2026-07-28 14:30",
    rationale: "Customer expresses frustration with team invite flow latency and outdated documentation.",
  },
  {
    id: "fb-102",
    content: "The new dashboard is gorgeous and finally fast. Huge performance improvement on v2 release!",
    channel: "APP_STORE_REVIEW",
    customerLabel: "David K. (Linear)",
    sentiment: "POS",
    sentimentScore: 0.92,
    status: "REVIEWED",
    featureArea: "Dashboard",
    themes: ["Dashboard Speed", "UI Aesthetics"],
    createdAt: "2026-07-28 12:15",
    rationale: "High satisfaction praised regarding dashboard loading velocity and visual redesign.",
  },
];

export default function FeedbackInboxPage() {
  const [search, setSearch] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [data, setData] = useState<FeedbackItem[]>(mockFeedbackData);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  const fetchFeedback = () => {
    fetch("/api/feedback")
      .then((res) => (res.ok ? res.json() : null))
      .then((apiData) => {
        if (Array.isArray(apiData) && apiData.length > 0) {
          const mapped = apiData.map((item: {
            id: string;
            content: string;
            channel: string;
            customerName?: string;
            sentimentLabel?: string;
            sentimentScore?: number;
            status?: string;
            createdAt?: string;
            theme?: { title: string };
          }) => ({
            id: item.id,
            content: item.content,
            channel: item.channel,
            customerLabel: item.customerName || "Customer Feedback",
            sentiment: (item.sentimentLabel === "POSITIVE" ? "POS" : item.sentimentLabel === "NEGATIVE" ? "NEG" : "NEU") as "POS" | "NEU" | "NEG",
            sentimentScore: item.sentimentScore || 0,
            status: (item.status || "NEW") as "NEW" | "REVIEWED" | "ACTIONED",
            featureArea: item.theme?.title || "Customer Experience",
            themes: [item.theme?.title || "Feedback"],
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString().replace("T", " ").substring(0, 16) : "Just now",
            rationale: `AI auto-classified with sentiment score ${item.sentimentScore || 0}.`,
          }));
          setData(mapped);
        }
      })
      .catch(() => {
        // Fallback to initial mock data if offline
      });
  };

  useEffect(() => {
    fetchFeedback();
  }, []);



  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.customerLabel.toLowerCase().includes(search.toLowerCase()) ||
      item.featureArea.toLowerCase().includes(search.toLowerCase());
    const matchesSentiment = selectedSentiment === "ALL" || item.sentiment === selectedSentiment;
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;

    return matchesSearch && matchesSentiment && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: "NEW" | "REVIEWED" | "ACTIONED") => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleReclassify = (id: string) => {
    setReclassifyingId(id);
    setTimeout(() => {
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, sentiment: item.sentiment === "NEG" ? "POS" : "NEG", sentimentScore: 0.88 }
            : item
        )
      );
      setReclassifyingId(null);
    }, 1000);
  };

  return (
    <DashboardLayout>
      {/* Top Title & Quick Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Inbox className="w-7 h-7 text-emerald-400" />
            <span>Feedback Triage Inbox</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search, filter, and action multi-channel customer feedback with AI auto-tagging
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            Total Items: {filteredData.length}
          </span>
        </div>

      </div>

      {/* Filter Controls Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchBar value={search} onChange={setSearch} placeholder="Search customer quotes, company names, or feature areas..." />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Sentiment Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="ALL">All Sentiments</option>
                <option value="POS">Positive Only</option>
                <option value="NEU">Neutral Only</option>
                <option value="NEG">Negative Only</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="ACTIONED">ACTIONED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Feedback Table */}
      <Card className="p-0 overflow-hidden">
        {filteredData.length === 0 ? (
          <EmptyState
            title="No Matching Feedback"
            description="Try clearing your search term or sentiment filter parameters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch("");
              setSelectedSentiment("ALL");
              setSelectedStatus("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Customer & Channel</th>
                  <th className="py-4 px-6">Feedback Quote</th>
                  <th className="py-4 px-6">AI Feature Area</th>
                  <th className="py-4 px-6">Sentiment</th>
                  <th className="py-4 px-6">Status Workflow</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-4 px-6 font-medium whitespace-nowrap">
                      <div className="font-semibold text-white">{item.customerLabel}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.channel}</div>
                    </td>

                    <td className="py-4 px-6 max-w-md">
                      <p className="line-clamp-2 italic text-slate-200">&quot;{item.content}&quot;</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">

                        {item.themes.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-semibold text-emerald-400 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        {item.featureArea}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          item.sentiment === "POS"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : item.sentiment === "NEG"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {item.sentiment} ({item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore})
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as "NEW" | "REVIEWED" | "ACTIONED")
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                          item.status === "ACTIONED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : item.status === "REVIEWED"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="ACTIONED">ACTIONED</option>
                      </select>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleReclassify(item.id)}
                        disabled={reclassifyingId === item.id}
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                        title="Re-classify with AI"
                      >
                        <RefreshCw className={`w-4 h-4 ${reclassifyingId === item.id ? "animate-spin" : ""}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Showing 1 - {filteredData.length} of {filteredData.length} items</span>
          <div className="flex items-center gap-2">
            <button disabled className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 opacity-50 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">Page 1 of 1</span>
            <button disabled className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 opacity-50 cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Detail Slide-over / Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Feedback Detail & AI Classification"
        >
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-white">{selectedItem.customerLabel}</span>
                <span className="font-mono">{selectedItem.createdAt}</span>
              </div>
              <p className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 italic leading-relaxed">
                &quot;{selectedItem.content}&quot;
              </p>

            </div>

            {/* AI Classification Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  AI Classification Reasoning
                </h4>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  Score: {selectedItem.sentimentScore}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.rationale}</p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400">Assigned Themes:</span>
                {selectedItem.themes.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onSuccess={() => fetchFeedback()}
      />
    </DashboardLayout>
  );
}

