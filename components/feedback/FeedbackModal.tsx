"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { Loader2 } from "lucide-react";

export interface FeedbackFormValues {
  id?: string;
  customerName: string;
  customerEmail: string;
  company: string;
  channel: "SUPPORT_TICKET" | "APP_STORE_REVIEW" | "NPS_SURVEY" | "SALES_CALL_NOTE" | "COMMUNITY_POST";
  source: string;
  rating: number;
  content: string;
  tags: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "NEW" | "REVIEWED" | "ACTIONED" | "ARCHIVED";
  product: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: FeedbackFormValues | null;
}

export default function FeedbackModal({ isOpen, onClose, onSuccess, initialData }: FeedbackModalProps) {
  const isEdit = !!initialData?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FeedbackFormValues>({
    customerName: "",
    customerEmail: "",
    company: "",
    channel: "SUPPORT_TICKET",
    source: "Web Portal",
    rating: 5,
    content: "",
    tags: "",
    category: "General",
    priority: "MEDIUM",
    status: "NEW",
    product: "Core Platform",
  });

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      if (initialData) {
        setForm({
          id: initialData.id,
          customerName: initialData.customerName || "",
          customerEmail: initialData.customerEmail || "",
          company: initialData.company || "",
          channel: initialData.channel || "SUPPORT_TICKET",
          source: initialData.source || "Web Portal",
          rating: initialData.rating || 5,
          content: initialData.content || "",
          tags: initialData.tags || "",
          category: initialData.category || "General",
          priority: initialData.priority || "MEDIUM",
          status: initialData.status || "NEW",
          product: initialData.product || "Core Platform",
        });
      } else {
        setForm({
          customerName: "",
          customerEmail: "",
          company: "",
          channel: "SUPPORT_TICKET",
          source: "Web Portal",
          rating: 5,
          content: "",
          tags: "",
          category: "General",
          priority: "MEDIUM",
          status: "NEW",
          product: "Core Platform",
        });
      }
    });
    return () => cancelAnimationFrame(handle);
  }, [initialData, isOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/feedback/${initialData?.id}` : "/api/feedback";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to save feedback record.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Customer Feedback" : "Create New Feedback"}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-300">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Customer Email</label>
            <input
              type="email"
              required
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
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
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Stripe"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Channel</label>
            <select
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value as FeedbackFormValues["channel"] })}
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
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-400 mb-1">Feedback Quote / Content</label>
          <textarea
            required
            rows={3}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Enter full customer quote or feedback details..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
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
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as FeedbackFormValues["priority"] })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Status Workflow</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as FeedbackFormValues["status"] })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="NEW">NEW</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="ACTIONED">ACTIONED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-400 mb-1">Tags (Comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Onboarding, Dashboard Speed, Latency"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          />
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
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEdit ? "Update Record" : "Save Record"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
