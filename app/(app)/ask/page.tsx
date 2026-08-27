"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
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
  Copy,
  Check,
  Sliders,
  FileText,
  Building,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  Square,
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
  feedbackGiven?: "up" | "down" | null;
}

interface ChatSessionItem {
  id: string;
  title: string;
  isPinned: boolean;
  model: string;
  updatedAt: string;
}

const defaultSuggestedPrompts = [
  "Analyze my latest customer feedback",
  "What are the biggest customer pain points?",
  "Summarize negative feedback",
  "What features are customers requesting?",
  "What should our product team prioritize?",
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
  const { data: session } = useSession();
  const workspaceName = (session?.user as { workspaceName?: string })?.workspaceName || "Acme Production Workspace";

  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [selectedModel, setSelectedModel] = useState("Auto");
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Rename session modal state
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [newTitleInput, setNewTitleInput] = useState("");

  const streamAbortController = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchChatSessions();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
        setMessages([]);
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
          setMessages([]);
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

  const handleRenameSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingSessionId || !newTitleInput.trim()) return;

    try {
      const res = await fetch(`/api/chats/${renamingSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitleInput.trim() }),
      });
      if (res.ok) {
        fetchChatSessions();
      }
    } catch (err) {
      console.error("Rename session error:", err);
    }
    setRenamingSessionId(null);
    setNewTitleInput("");
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chats/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Delete session error:", err);
    }
  };

  const handleStopGeneration = () => {
    if (streamAbortController.current) {
      streamAbortController.current.abort();
      streamAbortController.current = null;
      setLoading(false);
    }
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

    const controller = new AbortController();
    streamAbortController.current = controller;

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
      if ((err as Error)?.name === "AbortError") {
        console.log("Generation stopped by user.");
      } else {
        const errorMsg: Message = {
          id: `msg-e-${currentCount + 2}`,
          sender: "ai",
          text: `Error: ${err instanceof Error ? err.message : "Failed to fetch response."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
      streamAbortController.current = null;
    }
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
    if (lastUserMsg) {
      handleSendPrompt(lastUserMsg.text);
    }
  };

  const handleFeedback = (msgId: string, feedbackType: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedbackGiven: feedbackType } : m))
    );
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt(input);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
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
            <span>Ask LOOP (AI Intelligence Assistant)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Conversational RAG assistant grounded strictly in your authorized workspace customer feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Workspace Context Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Building className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-white truncate max-w-[160px]">{workspaceName}</span>
          </div>

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
            <span>Grounded RAG Active</span>
          </div>
        </div>
      </div>

      {uploadNotice && (
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between mt-4">
          <span>{uploadNotice}</span>
          <button onClick={() => setUploadNotice(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar + Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Sidebar: Chat Threads & Workspace Files */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Conversations</span>
              </h3>
              <button
                onClick={handleCreateSession}
                className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition text-xs flex items-center gap-1 font-bold shadow-md"
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
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Sessions List */}
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredSessions.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">No past conversations.</p>
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
                          setRenamingSessionId(s.id);
                          setNewTitleInput(s.title);
                        }}
                        className="p-1 text-slate-500 hover:text-emerald-400"
                        title="Rename conversation"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
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
        </div>

        {/* Chat Main Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 min-h-[580px] flex flex-col justify-between relative">
            {/* Messages Feed or Empty State */}
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md">
                  <h2 className="text-2xl font-extrabold text-white">How can LOOP help you today?</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ask questions about your workspace feedback, generate executive digests, or uncover customer friction points.
                  </p>
                </div>

                {/* Dynamic Suggested Prompts */}
                <div className="w-full max-w-xl space-y-2.5 pt-2">
                  <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    Suggested Prompts for {workspaceName}:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {defaultSuggestedPrompts.map((p) => (
                      <div
                        key={p}
                        onClick={() => handleSendPrompt(p)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 cursor-pointer transition text-xs text-slate-300 flex items-center justify-between group"
                      >
                        <span>{p}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
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
                          ? "bg-emerald-600 text-white rounded-tr-none shadow-md"
                          : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs opacity-70 border-b border-slate-800/60 pb-2">
                        <span className="font-semibold">{msg.sender === "user" ? "You" : "LOOP AI"}</span>
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

                          {msg.sender === "ai" && (
                            <div className="flex items-center gap-1.5 pl-2">
                              <button
                                onClick={() => handleFeedback(msg.id, "up")}
                                className={`p-1 hover:text-emerald-400 ${
                                  msg.feedbackGiven === "up" ? "text-emerald-400 font-bold" : "text-slate-500"
                                }`}
                                title="Helpful"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, "down")}
                                className={`p-1 hover:text-rose-400 ${
                                  msg.feedbackGiven === "down" ? "text-rose-400 font-bold" : "text-slate-500"
                                }`}
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                      <span>Streaming response tokens from workspace RAG memory...</span>
                      <button
                        onClick={handleStopGeneration}
                        className="ml-4 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold transition flex items-center gap-1"
                      >
                        <Square className="w-3 h-3 fill-rose-300" />
                        <span>Stop</span>
                      </button>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Input Bar & Controls */}
            <div className="space-y-3 pt-4 border-t border-slate-800 mt-4">
              {/* Action Bar (Regenerate / Stop) */}
              <div className="flex items-center justify-between text-xs">
                {messages.length > 0 && !loading && (
                  <button
                    onClick={handleRegenerate}
                    className="text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Regenerate Response</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-500 font-mono ml-auto">
                  Press <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Enter</kbd> to send, <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Shift+Enter</kbd> for new line
                </span>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendPrompt(input); }} className="flex gap-3">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDownInput}
                  placeholder={`Ask LOOP AI about ${workspaceName} feedback, pain points, or reports...`}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition flex items-center justify-center gap-2 disabled:opacity-50 h-auto"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Rename Conversation Modal */}
      {renamingSessionId && (
        <Modal
          isOpen={!!renamingSessionId}
          onClose={() => setRenamingSessionId(null)}
          title="Rename Conversation"
        >
          <form onSubmit={handleRenameSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Conversation Title
              </label>
              <input
                type="text"
                required
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRenamingSessionId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md"
              >
                Save Title
              </button>
            </div>
          </form>
        </Modal>
      )}

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
