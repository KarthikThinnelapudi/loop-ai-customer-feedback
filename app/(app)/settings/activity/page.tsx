"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import { Activity } from "lucide-react";


interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

const auditLogs: AuditLog[] = [
  { id: "log-1", user: "Alex Mercer (Admin)", action: "FEEDBACK_INGESTED", target: "25 Simulated Items Injected", timestamp: "2026-07-28 14:32", ip: "192.168.1.1" },
  { id: "log-2", user: "Sarah Jenkins (Analyst)", action: "STATUS_CHANGED", target: "Feedback #fb-101 -> ACTIONED", timestamp: "2026-07-28 12:10", ip: "192.168.1.4" },
  { id: "log-3", user: "Alex Mercer (Admin)", action: "REPORT_GENERATED", target: "Weekly Executive VoC Digest", timestamp: "2026-07-28 10:05", ip: "192.168.1.1" },
  { id: "log-4", user: "Alex Mercer (Admin)", action: "MEMBER_INVITED", target: "elena@acme.com as ANALYST", timestamp: "2026-07-27 16:20", ip: "192.168.1.1" },
];

export default function ActivityPage() {
  return (
    <DashboardLayout>
      <div className="border-b border-slate-800/80 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Activity className="w-7 h-7 text-emerald-400" />
          <span>Workspace Audit & Activity Logs</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete audit history of workspace actions, data mutations, role changes, and AI report generations
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
            <tr>
              <th className="py-4 px-6">User / Actor</th>
              <th className="py-4 px-6">Action Event</th>
              <th className="py-4 px-6">Target Object</th>
              <th className="py-4 px-6">Timestamp</th>
              <th className="py-4 px-6 font-mono text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/50 transition">
                <td className="py-4 px-6 font-semibold text-white">{log.user}</td>
                <td className="py-4 px-6 font-mono text-emerald-400">{log.action}</td>
                <td className="py-4 px-6 text-slate-300">{log.target}</td>
                <td className="py-4 px-6 text-slate-400">{log.timestamp}</td>
                <td className="py-4 px-6 text-slate-500 font-mono text-right">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardLayout>
  );
}
