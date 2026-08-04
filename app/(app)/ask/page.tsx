"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import Modal from "@/components/common/Modal";
import {
  Sparkles,
  Send,
  User,
  Bot,
  Quote,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  Clock,
  Zap,
  DollarSign,
  PieChart as PieChartIcon,
} from "lucide-react";

interface Citation {
  id: string;
  customer: string;
  quote: string;
  channel: string;
  sentimentScore?: number;
  sentimentLabel?: string;
}

interface RAGMetrics {
  retrievalLatencyMs: number;
  rerankingLatencyMs: number;
  generationLatencyMs: number;
  totalLatencyMs: number;
  tokensUsed: number;
  estimatedCostUsd: number;
  cacheHit: boolean;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  citations?: Citation[];
  timestamp: string;
  groundedScore?: number;
  metrics?: RAGMetrics;
  intent?: string;
}

const initialMessages: Message[] = [
  {
    id: "msg-1",
    sender: "ai",
    text: `Hello! I am **Ask LOOP**, your enterprise grounded AI Customer Feedback Assistant.\n\nAsk me anything about customer complaints, feature requests, sentiment trends, or request a complete **Executive Report**, and I will generate structured answers grounded strictly in real customer evidence.`,
    timestamp: "10:00 AM",
  },
];

const suggestedPrompts = [
  "Generate a complete executive report",
  "What are users saying about onboarding friction?",
  "List top enterprise SSO feature requests",
  "Perform a root cause analysis of complaints",
  "Summarize sentiment ratio across channels",
];

export default function AskLoopPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const currentCount = messages.length;
    const userMsg: Message = {
      id: `msg-u-${currentCount + 1}`,
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Build multi-turn conversation memory history
    const historyPayload = newMessages.slice(-6).map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, history: historyPayload }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to process query");
      }

      const aiMsg: Message = {
        id: `msg-a-${currentCount + 2}`,
        sender: "ai",
        text: data.answer,
        citations: data.citations || [],
        groundedScore: data.groundedScore,
        metrics: data.metrics,
        intent: data.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const errorMsg: Message = {
        id: `msg-e-${currentCount + 2}`,
        sender: "ai",
        text: `Error: ${err instanceof Error ? err.message : "Failed to fetch response."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-emerald-400" />
            <span>Ask LOOP (Grounded Enterprise RAG)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Hybrid vector RRF retrieval, intent classification & zero prompt echoing. Guaranteed evidence-based Q&A.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Hybrid RRF RAG Active</span>
        </div>
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs text-slate-500 font-mono shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> Try:
        </span>
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSendPrompt(p)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 whitespace-nowrap transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <Card className="p-6 space-y-6 min-h-[520px] flex flex-col justify-between">
        <div className="space-y-6 overflow-y-auto max-h-[540px] pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-5 space-y-4 ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                <div className="flex items-center justify-between text-xs opacity-70 border-b border-slate-800/60 pb-2">
                  <span className="font-semibold">{msg.sender === "user" ? "You" : "Ask LOOP AI"}</span>
                  <div className="flex items-center gap-2 font-mono">
                    {msg.intent && (
                      <span className="text-[10px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                        INTENT: {msg.intent}
                      </span>
                    )}
                    {msg.groundedScore && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Score: {msg.groundedScore}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                  {msg.text}
                </div>

                {/* Observability Metrics Bar */}
                {msg.metrics && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>Total: {msg.metrics.totalLatencyMs}ms (Ret: {msg.metrics.retrievalLatencyMs}ms / Rank: {msg.metrics.rerankingLatencyMs}ms)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold ${msg.metrics.cacheHit ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                        {msg.metrics.cacheHit ? "CACHE HIT" : "LIVE RRF"}
                      </span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Zap className="w-3 h-3 text-amber-400" /> {msg.metrics.tokensUsed} tokens
                      </span>
                      <span className="flex items-center gap-0.5 text-slate-300">
                        <DollarSign className="w-3 h-3 text-emerald-400" /> ${(msg.metrics.estimatedCostUsd).toFixed(5)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Clickable Grounded Citation Cards */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <Quote className="w-3.5 h-3.5" /> Clickable Cited Grounded Evidence ({msg.citations.length} Verified Quotes)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCitation(c)}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition text-xs space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 group-hover:text-emerald-300">
                            <span>{c.customer}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{c.channel}</span>
                          </div>
                          <p className="text-slate-400 italic text-[11px] line-clamp-2">&quot;{c.quote}&quot;</p>
                          <div className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1 pt-0.5">
                            <span>Click to inspect full quote →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Follow-Up Question Recommendations */}
                {msg.sender === "ai" && msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <PieChartIcon className="w-3 h-3 text-emerald-400" /> Suggested Follow-ups:
                    </span>
                    <button
                      onClick={() => handleSendPrompt("What is the root cause analysis of these quotes?")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    >
                      Why is this occurring?
                    </button>
                    <button
                      onClick={() => handleSendPrompt("Generate a priority matrix for engineering action")}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    >
                      Priority Matrix
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 items-center text-slate-400 text-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Running pgvector hybrid RRF retrieval & multi-factor reranking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="flex gap-3 pt-4 border-t border-slate-800">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or request 'Generate a complete executive report'..."
            className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </Card>

      {/* Citation Inspection Modal */}
      {selectedCitation && (
        <Modal
          isOpen={!!selectedCitation}
          onClose={() => setSelectedCitation(null)}
          title="Verified Customer Evidence Inspection"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedCitation.customer}</h4>
                <p className="text-[11px] text-slate-400 font-mono">Channel: {selectedCitation.channel}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono text-[11px]">
                Score: {selectedCitation.sentimentScore || 0}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed font-sans text-sm italic">
              &quot;{selectedCitation.quote}&quot;
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
