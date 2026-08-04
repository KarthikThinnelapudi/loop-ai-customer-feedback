"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import { BarChart3, TrendingUp, Layers, Download } from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const sentimentTrend = [
  { date: "Jul 01", pos: 65, neu: 20, neg: 15 },
  { date: "Jul 07", pos: 70, neu: 18, neg: 12 },
  { date: "Jul 14", pos: 58, neu: 22, neg: 20 },
  { date: "Jul 21", pos: 78, neu: 14, neg: 8 },
  { date: "Jul 28", pos: 84, neu: 10, neg: 6 },
];

const channelBreakdown = [
  { channel: "Support Tickets", count: 245, sentiment: "82% Pos" },
  { channel: "App Reviews", count: 180, sentiment: "91% Pos" },
  { channel: "NPS Surveys", count: 120, sentiment: "75% Pos" },
  { channel: "Sales Notes", count: 95, sentiment: "60% Pos" },
  { channel: "Community", count: 60, sentiment: "88% Pos" },
];

const categoryPieData = [
  { name: "Onboarding", value: 35, color: "#10B981" },
  { name: "Performance", value: 25, color: "#06B6D4" },
  { name: "Integrations", value: 20, color: "#8B5CF6" },
  { name: "Billing", value: 12, color: "#F59E0B" },
  { name: "UI/UX", value: 8, color: "#EC4899" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");

  const handleExportAnalyticsCsv = () => {
    const csvLines = [
      ["Category", "Share Percentage (%)"],
      ...categoryPieData.map((c) => [c.name, `${c.value}%`]),
      [],
      ["Channel", "Feedback Count", "Sentiment Score"],
      ...channelBreakdown.map((b) => [b.channel, b.count, b.sentiment]),
    ];

    const csvContent = csvLines.map((line) => line.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            <span>Deep Analytics & Sentiment Trends</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quantitative analysis of customer sentiment deltas, channel volume, and feature area distribution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setRange("7d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === "7d" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange("30d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === "30d" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRange("90d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                range === "90d" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              90 Days
            </button>
          </div>

          <button
            onClick={handleExportAnalyticsCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>

      {/* Main Sentiment Trend Chart */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Sentiment Evolution Ratio Over Time
            </h3>
            <p className="text-xs text-slate-400">Weekly breakdown of Positive vs Neutral vs Negative feedback</p>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sentimentTrend}>
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
              <Area type="monotone" dataKey="pos" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="neu" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              <Area type="monotone" dataKey="neg" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Volume Bar Chart */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Feedback Volume by Ingestion Channel
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="channel" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Feature Area Pie Chart */}
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Feature Area Category Share
          </h3>

          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
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
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs pt-2 border-t border-slate-800">
            {categoryPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
