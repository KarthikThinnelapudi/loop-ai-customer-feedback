"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import {
  Sparkles,
  Send,
  User,
  Bot,
  Quote,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface Citation {
  id: string;
  customer: string;
  quote: string;
  channel: string;
  sentimentScore?: number;
  sentimentLabel?: string;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  citations?: Citation[];
  timestamp: string;
  groundedScore?: number;
}

const initialMessages: Message[] = [
  {
    id: "msg-1",
    sender: "ai",
    text: `Hello! I am **Ask LOOP**, your grounded AI Customer Feedback Assistant.\n\nAsk me anything about customer complaints, feature requests, sentiment trends, or request a complete **Executive Report**, and I will generate structured answers grounded strictly in real customer evidence.`,
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

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const currentCount = messages.length;
    const userMsg: Message = {
      id: `msg-u-${currentCount + 1}`,
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
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
            <span>Ask LOOP (Grounded RAG Q&A)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Natural language Q&A grounded strictly in vector-retrieved customer quotes. Zero prompt echoing & zero AI hallucination.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Grounded RAG Pipeline Active</span>
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
      <Card className="p-6 space-y-6 min-h-[500px] flex flex-col justify-between">
        <div className="space-y-6 overflow-y-auto max-h-[520px] pr-2">
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

                {/* Grounded Citation Cards */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <Quote className="w-3.5 h-3.5" /> Cited Grounded Evidence ({msg.citations.length} Verified Quotes)
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.citations.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                            <span>{c.customer}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{c.channel}</span>
                          </div>
                          <p className="text-slate-400 italic text-[11px]">&quot;{c.quote}&quot;</p>
                        </div>
                      ))}
                    </div>
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
                <span>Searching vector-indexed feedback & synthesizing grounded response...</span>
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
    </DashboardLayout>
  );
}
