"use client";

import { useState, useEffect } from "react";
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
  Plus,
  Search,
  Pin,
  Trash2,
  Download,
  Upload,
  Copy,
  Check,
  Sliders,
  FileText,
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
  provider?: string;
  model?: string;
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

interface ChatSessionItem {
  id: string;
  title: string;
  isPinned: boolean;
  model: string;
  updatedAt: string;
}

const suggestedPrompts = [
  "Generate a complete executive report",
  "What are users saying about onboarding friction?",
  "List top enterprise SSO feature requests",
  "Perform a root cause analysis of complaints",
  "Summarize sentiment ratio across channels",
];

const availableModels = [
  { id: "Auto", name: "Auto (Smart Gateway Routing)" },
  { id: "gemini-1.5-flash", name: "Google Gemini 1.5 Flash (Fast)" },
  { id: "gemini-1.5-pro", name: "Google Gemini 1.5 Pro (Deep)" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "OpenRouter Llama 3.3 70B" },
  { id: "meta/llama-3.1-405b-instruct", name: "NVIDIA Llama 3.1 405B" },
  { id: "omniroute-local-v1", name: "OmniRoute Local Gateway" },
];

export default function AskLoopPage() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: `Hello! I am **Ask LOOP**, your enterprise grounded AI Customer Feedback Assistant.\n\nAsk me anything about customer complaints, feature requests, sentiment trends, or request a complete **Executive Report**, and I will generate structured answers grounded strictly in real customer evidence.`,
      timestamp: "10:00 AM",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [selectedModel, setSelectedModel] = useState("Auto");
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchChatSessions();
  }, []);

  const fetchChatSessions = async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.warn("Failed to load chat sessions:", err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation", model: selectedModel }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([
          {
            id: `msg-init-${Date.now()}`,
            sender: "ai",
            text: `Started new conversation thread in model **${selectedModel}**. How can I analyze customer feedback for you today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err) {
      console.error("Create session error:", err);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const res = await fetch(`/api/chats/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const loadedMsgs: Message[] = data.messages.map((m: { id: string; role: string; content: string; citations?: unknown; metrics?: unknown; createdAt: string }) => ({
            id: m.id,
            sender: m.role === "user" ? "user" : "ai",
            text: m.content,
            citations: m.citations as Citation[] | undefined,
            metrics: m.metrics as RAGMetrics | undefined,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          setMessages(loadedMsgs);
        } else {
          setMessages([
            {
              id: `msg-empty-${Date.now()}`,
              sender: "ai",
              text: `Thread loaded: **${data.title}**. Ask your question to query indexed workspace feedback.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Select session error:", err);
    }
  };

  const handleTogglePin = async (sessionId: string, currentPin: boolean) => {
    try {
      const res = await fetch(`/api/chats/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentPin }),
      });
      if (res.ok) {
        fetchChatSessions();
      }
    } catch (err) {
      console.error("Toggle pin error:", err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chats/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }
      }
    } catch (err) {
      console.error("Delete session error:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    setUploadNotice(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadNotice(`✅ Document "${file.name}" uploaded and indexed into RAG memory (${data.document.chunkCount} chunks).`);
      } else {
        setUploadNotice(`⚠️ Upload failed: ${data.message}`);
      }
    } catch (err) {
      setUploadNotice("❌ Upload exception occurred.");
      console.error(err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

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

    const historyPayload = newMessages.slice(-6).map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));

    try {
      // Use Real-time Server-Sent Events (SSE) Streaming API
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          sessionId: activeSessionId,
          model: selectedModel,
          history: historyPayload,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to initialize SSE stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";
      let streamedCitations: Citation[] = [];
      let streamedMetrics: RAGMetrics | undefined;
      let streamedIntent: string | undefined;
      let streamedScore: number | undefined;

      const streamMsgId = `msg-a-${currentCount + 2}`;
      const initialAiMsg: Message = {
        id: streamMsgId,
        sender: "ai",
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, initialAiMsg]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.type === "meta") {
                streamedCitations = data.citations || [];
                streamedMetrics = data.metrics;
                streamedIntent = data.intent;
                streamedScore = data.groundedScore;
              } else if (data.type === "token") {
                streamedText += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? {
                          ...m,
                          text: streamedText,
                          citations: streamedCitations,
                          metrics: streamedMetrics,
                          intent: streamedIntent,
                          groundedScore: streamedScore,
                        }
                      : m
                  )
                );
              }
            } catch {
              // Ignore partial JSON parse chunks
            }
          }
        }
      }
      fetchChatSessions();
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

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-emerald-400" />
            <span>Ask LOOP (Enterprise AI Assistant)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time SSE token streaming, multi-model switcher, session memory & multi-file document RAG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Model Switcher Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SSE Stream Active</span>
          </div>
        </div>
      </div>

      {uploadNotice && (
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>{uploadNotice}</span>
          <button onClick={() => setUploadNotice(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Chat Sessions Sidebar + Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Conversation Sessions & Document Upload */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Chat Threads</span>
              </h3>
              <button
                onClick={handleCreateSession}
                className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition text-xs flex items-center gap-1 font-bold"
                title="New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Search Threads */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Sessions List */}
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredSessions.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">No threads found.</p>
              ) : (
                filteredSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition group ${
                      activeSessionId === s.id
                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold"
                        : "bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{s.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePin(s.id, s.isPinned);
                        }}
                        className={`p-1 hover:text-amber-400 ${s.isPinned ? "text-amber-400" : "text-slate-500"}`}
                        title="Pin thread"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(s.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Delete thread"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Document RAG File Upload Box */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Multi-File RAG Ingestion</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Upload PDF, DOCX, TXT, CSV, or XLSX files to index into workspace RAG memory.
            </p>
            <label className="block w-full cursor-pointer">
              <div className="p-3 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 text-center transition space-y-1">
                <Upload className="w-5 h-5 text-emerald-400 mx-auto" />
                <span className="text-xs text-slate-300 font-semibold block">
                  {uploadingDoc ? "Parsing & Indexing..." : "Choose File to Index"}
                </span>
                <span className="text-[10px] text-slate-500 block">PDF, DOCX, CSV, TXT up to 10MB</span>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploadingDoc}
                accept=".pdf,.docx,.txt,.csv,.xlsx,.png,.jpg"
                className="hidden"
              />
            </label>
          </Card>
        </div>

        {/* Chat Interface Main Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Suggested Prompts */}
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
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="p-1 hover:text-emerald-300 text-slate-400"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                      {msg.text || (loading && msg.sender === "ai" ? "Streaming tokens via SSE..." : "")}
                    </div>

                    {/* Observability Metrics Bar */}
                    {msg.metrics && (
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>Total: {msg.metrics.totalLatencyMs}ms (Ret: {msg.metrics.retrievalLatencyMs}ms / Gen: {msg.metrics.generationLatencyMs}ms)</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300">
                            {msg.metrics.provider || "Gemini"} ({msg.metrics.model || selectedModel})
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
                          <Quote className="w-3.5 h-3.5" /> Clickable Grounded Evidence ({msg.citations.length} Quotes)
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
                    <span>Streaming SSE tokens & running dynamic RRF reranking...</span>
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
                placeholder="Ask LOOP AI or query uploaded documents..."
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
        </div>
      </div>

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
