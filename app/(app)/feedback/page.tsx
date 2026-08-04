"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import SearchBar from "@/components/common/SearchBar";
import EmptyState from "@/components/common/EmptyState";
import Modal from "@/components/common/Modal";
import {
  Inbox,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Sparkles,
  Upload,
  Plus,
  Archive,
  ShieldAlert,
} from "lucide-react";

import CSVUploadModal from "@/components/feedback/CSVUploadModal";
import FeedbackModal, { FeedbackFormValues } from "@/components/feedback/FeedbackModal";
import { hasPermission } from "@/lib/rbac";

interface FeedbackItem {
  id: string;
  content: string;
  channel: string;
  customerName?: string;
  customerEmail?: string;
  customerLabel: string;
  company?: string;
  rating?: number;
  category?: string;
  priority?: string;
  product?: string;
  sentiment: "POS" | "NEU" | "NEG";
  sentimentScore: number;
  status: "NEW" | "REVIEWED" | "ACTIONED" | "ARCHIVED";
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
    customerName: "Sarah Jenkins",
    customerEmail: "sarah@stripe.com",
    customerLabel: "Sarah Jenkins (Stripe)",
    company: "Stripe",
    rating: 2,
    category: "UX",
    priority: "HIGH",
    product: "Core Platform",
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
    customerName: "David Miller",
    customerEmail: "david@linear.app",
    customerLabel: "David Miller (Linear)",
    company: "Linear",
    rating: 5,
    category: "Performance",
    priority: "LOW",
    product: "Dashboard",
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
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role?.toUpperCase() || "VIEWER";

  const canCreate = hasPermission(userRole, "feedback:create");
  const canEdit = hasPermission(userRole, "feedback:edit");
  const canDelete = hasPermission(userRole, "feedback:delete");
  const canStatus = hasPermission(userRole, "feedback:status");
  const canImport = hasPermission(userRole, "csv:upload");

  const [search, setSearch] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedbackFormValues | null>(null);
  const [data, setData] = useState<FeedbackItem[]>(mockFeedbackData);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchFeedback = () => {
    fetch("/api/feedback")
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        const apiData = resData?.data || resData;
        if (Array.isArray(apiData) && apiData.length > 0) {
          const mapped = apiData.map((item: {
            id: string;
            content: string;
            channel: string;
            customerName?: string;
            customerEmail?: string;
            company?: string;
            rating?: number;
            category?: string;
            priority?: string;
            product?: string;
            sentimentLabel?: string;
            sentimentScore?: number;
            status?: string;
            createdAt?: string;
            theme?: { title: string };
          }) => ({
            id: item.id,
            content: item.content,
            channel: item.channel,
            customerName: item.customerName,
            customerEmail: item.customerEmail,
            customerLabel: `${item.customerName || "Customer"}${item.company ? ` (${item.company})` : ""}`,
            company: item.company || "Enterprise Account",
            rating: item.rating || 5,
            category: item.category || "General",
            priority: item.priority || "MEDIUM",
            product: item.product || "Core Platform",
            sentiment: (item.sentimentLabel === "POSITIVE" ? "POS" : item.sentimentLabel === "NEGATIVE" ? "NEG" : "NEU") as "POS" | "NEU" | "NEG",
            sentimentScore: item.sentimentScore || 0,
            status: (item.status || "NEW") as "NEW" | "REVIEWED" | "ACTIONED" | "ARCHIVED",
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredData.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (id: string, newStatus: "NEW" | "REVIEWED" | "ACTIONED" | "ARCHIVED") => {
    if (!canStatus) return;
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const handleDeleteItem = async (id: string) => {
    if (!canDelete) return;
    if (!confirm("Are you sure you want to soft delete this feedback record?")) return;
    setData((prev) => prev.filter((item) => item.id !== id));
    await fetch(`/api/feedback/${id}`, { method: "DELETE" });
  };

  const handleDuplicateItem = async (id: string) => {
    if (!canCreate) return;
    const res = await fetch("/api/feedback/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchFeedback();
  };

  const handleBulkAction = async (action: "delete" | "archive") => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !canDelete) return;
    if (action === "archive" && !canEdit) return;

    if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} selected items?`)) return;

    await fetch("/api/feedback/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: selectedIds }),
    });

    setSelectedIds([]);
    fetchFeedback();
  };

  return (
    <DashboardLayout>
      {/* Read-Only Notice Banner for Viewer Role */}
      {userRole === "VIEWER" && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>You are viewing in <strong>READ-ONLY</strong> mode (Viewer Role). Administrative, edit, and ingestion controls are disabled.</span>
        </div>
      )}

      {/* Top Title & Header Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Inbox className="w-7 h-7 text-emerald-400" />
            <span>Feedback Triage Inbox</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search, action, and manage multi-channel feedback with AI classification and enterprise CRUD
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <Plus className="w-4 h-4" />
              <span>New Feedback</span>
            </button>
          )}

          {canImport && (
            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (canEdit || canDelete) && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-white">
          <span className="font-semibold text-emerald-300">
            {selectedIds.length} records selected
          </span>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => handleBulkAction("archive")}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-medium transition flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5 text-amber-400" />
                <span>Archive Selected</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-medium transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <SearchBar value={search} onChange={setSearch} placeholder="Search quotes, customer names, companies, or feature tags..." />
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
              <option value="ARCHIVED">ARCHIVED</option>
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
                  {(canEdit || canDelete) && (
                    <th className="py-4 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-0"
                      />
                    </th>
                  )}
                  <th className="py-4 px-6">Customer & Company</th>
                  <th className="py-4 px-6">Feedback Quote</th>
                  <th className="py-4 px-6">Category & Priority</th>
                  <th className="py-4 px-6">Sentiment</th>
                  <th className="py-4 px-6">Status Workflow</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition">
                    {(canEdit || canDelete) && (
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-0"
                        />
                      </td>
                    )}

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
                        {item.category || item.featureArea}
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
                      {canStatus ? (
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value as FeedbackItem["status"])
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                            item.status === "ACTIONED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : item.status === "REVIEWED"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : item.status === "ARCHIVED"
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : "bg-slate-900 text-slate-300 border-slate-700"
                          }`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="REVIEWED">REVIEWED</option>
                          <option value="ACTIONED">ACTIONED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                            item.status === "ACTIONED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : item.status === "REVIEWED"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingItem({
                              id: item.id,
                              customerName: item.customerName || item.customerLabel,
                              customerEmail: item.customerEmail || "",
                              company: item.company || "",
                              channel: item.channel as FeedbackFormValues["channel"],
                              source: "Web Portal",
                              rating: item.rating || 5,
                              content: item.content,
                              tags: item.themes.join(", "),
                              category: item.category || "General",
                              priority: (item.priority as FeedbackFormValues["priority"]) || "MEDIUM",
                              status: item.status,
                              product: item.product || "Core Platform",
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canCreate && (
                        <button
                          onClick={() => handleDuplicateItem(item.id)}
                          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition"
                          title="Duplicate Record"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Slide-over / Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Feedback Detail & AI Classification"
        >
          <div className="space-y-6 text-xs text-slate-300">
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
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CSV Upload Modal */}
      {canImport && (
        <CSVUploadModal
          isOpen={isCSVModalOpen}
          onClose={() => setIsCSVModalOpen(false)}
          onSuccess={() => fetchFeedback()}
        />
      )}

      {/* Manual Create Modal */}
      {canCreate && (
        <FeedbackModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => fetchFeedback()}
        />
      )}

      {/* Full Edit Modal */}
      {canEdit && (
        <FeedbackModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => fetchFeedback()}
          initialData={editingItem}
        />
      )}
    </DashboardLayout>
  );
}
