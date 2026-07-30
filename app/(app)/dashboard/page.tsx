"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import {
  TrendingUp,
  MessageSquare,
  Smile,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// Mock Recharts Data
const defaultVolumeData = [
  { date: "Mon", total: 45, positive: 32, negative: 13 },
  { date: "Tue", total: 68, positive: 50, negative: 18 },
  { date: "Wed", total: 85, positive: 65, negative: 20 },
  { date: "Thu", total: 110, positive: 88, negative: 22 },
  { date: "Fri", total: 95, positive: 70, negative: 25 },
  { date: "Sat", total: 55, positive: 45, negative: 10 },
  { date: "Sun", total: 72, positive: 58, negative: 14 },
];

const sentimentData = [
  { name: "Positive", value: 68, color: "#10B981" },
  { name: "Neutral", value: 18, color: "#F59E0B" },
  { name: "Negative", value: 14, color: "#EF4444" },
];

const defaultThemesData = [
  { theme: "Dashboard Speed", count: 89, sentiment: 0.9 },
  { theme: "Onboarding Friction", count: 42, sentiment: -0.6 },
  { theme: "SSO & SAML Request", count: 35, sentiment: 0.1 },
  { theme: "Mobile Responsiveness", count: 28, sentiment: -0.4 },
  { theme: "CSV Export Bug", count: 19, sentiment: -0.8 },
];

const recentActivity = [
  {
    id: "fb-1",
    customer: "Sarah Jenkins (Stripe)",
    channel: "Support Ticket",
    quote: "Onboarding took forever — I couldn't figure out how to invite my team.",
    sentiment: "NEG",
    status: "NEW",
    time: "10 mins ago",
  },
  {
    id: "fb-2",
    customer: "David K. (Linear)",
    channel: "App Store Review",
    quote: "The new dashboard is gorgeous and finally fast. Huge improvement!",
    sentiment: "POS",
    status: "REVIEWED",
    time: "25 mins ago",
  },
  {
    id: "fb-3",
    customer: "Enterprise Prospect",
    channel: "Sales Call Note",
    quote: "Prospect wants SSO SAML integration before signing the annual tier.",
    sentiment: "NEU",
    status: "ACTIONED",
    time: "1 hour ago",
  },
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [totalVolume, setTotalVolume] = useState(548);
  const [positiveRatio, setPositiveRatio] = useState("82.4%");
  const [criticalSpikesCount, setCriticalSpikesCount] = useState(3);
  const [topThemes, setTopThemes] = useState(defaultThemesData);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((stats) => {
        if (stats) {
          if (stats.totalVolume) setTotalVolume(stats.totalVolume);
          if (stats.positiveRatio) setPositiveRatio(stats.positiveRatio);
          if (stats.criticalSpikesCount !== undefined) setCriticalSpikesCount(stats.criticalSpikesCount);
          if (Array.isArray(stats.themes) && stats.themes.length > 0) {
            setTopThemes(stats.themes.map((t: { title: string; mentions?: number; count?: number }) => ({
              theme: t.title,
              count: t.mentions || t.count || 20,
              sentiment: 0.8,
            })));
          }
        }
      })
      .catch(() => {
        // Fallback to initial state if offline
      });
  }, []);

  return (
    <DashboardLayout>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Executive Feedback Dashboard</span>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
              REAL-TIME INSIGHTS
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Aggregated multi-channel customer intelligence & AI-grounded theme spikes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === "7d" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === "30d" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange("90d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === "90d" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card glow>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Feedback</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-bold mt-2 text-white">{totalVolume}</h3>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% from last period</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Sentiment Score</span>
            <Smile className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-bold mt-2 text-emerald-400">{positiveRatio}</h3>
          <p className="text-slate-400 text-xs mt-2">68% Pos / 18% Neu / 14% Neg</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active AI Clusters</span>
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <h3 className="text-3xl font-bold mt-2 text-teal-300">{topThemes.length} Themes</h3>
          <p className="text-slate-400 text-xs mt-2">2 themes spiking in volume</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Needs Action</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <h3 className="text-3xl font-bold mt-2 text-rose-400">{criticalSpikesCount} Critical</h3>
          <p className="text-slate-400 text-xs mt-2">High severity negative quotes</p>
        </Card>
      </div>


      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Area Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Feedback Volume & Sentiment Stream
              </h3>
              <p className="text-xs text-slate-400">Daily ingested items categorized by sentiment</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">LIVE FEED</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sentiment Donut Chart */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smile className="w-4 h-4 text-teal-400" />
            Overall Sentiment Ratio
          </h3>
          <p className="text-xs text-slate-400">Distribution across all ingested feedback</p>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-white">68%</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Positive</span>
            </div>
          </div>

          <div className="flex justify-around pt-2 text-xs border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-300 font-medium">Positive (68%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="text-slate-300 font-medium">Neutral (18%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="text-slate-300 font-medium">Negative (14%)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Second Row: Top Themes & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Themes Bar Chart */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Top AI Theme Clusters
            </h3>
            <span className="text-xs text-emerald-400 font-semibold cursor-pointer hover:underline">View All →</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topThemes} margin={{ left: 20 }}>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="theme" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Feedback Triage Feed */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Recent AI Ingested Quotes
            </h3>
            <span className="text-xs text-emerald-400 font-semibold cursor-pointer hover:underline">Inbox →</span>
          </div>

          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.customer}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono">{item.time}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        item.sentiment === "POS"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : item.sentiment === "NEG"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic line-clamp-2">&quot;{item.quote}&quot;</p>


                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{item.channel}</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Tagged by AI
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
