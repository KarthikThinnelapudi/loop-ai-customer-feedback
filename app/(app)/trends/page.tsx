"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/common/Card";
import { hasPermission } from "@/lib/rbac";
import { TrendingUp, AlertTriangle, Layers, ChevronRight, ShieldAlert } from "lucide-react";

interface SpikingTheme {
  id: string;
  name: string;
  count: number;
  growth: string;
  isSpike: boolean;
  quotes: string[];
}

const themeTrendsData: SpikingTheme[] = [
  {
    id: "th-1",
    name: "Onboarding Friction",
    count: 42,
    growth: "+62% vs last week",
    isSpike: true,
    quotes: [
      "Onboarding took forever — I couldn't figure out how to invite my team.",
      "Inviting 5 members during initial setup timed out twice before succeeding.",
      "Setup wizard docs are missing steps for SAML login setup.",
    ],
  },
  {
    id: "th-2",
    name: "Dashboard Speed",
    count: 89,
    growth: "+34% vs last week",
    isSpike: false,
    quotes: [
      "The new dashboard is gorgeous and finally fast. Huge improvement!",
      "Fast page transitions on v2 release.",
    ],
  },
  {
    id: "th-3",
    name: "SSO & SAML Request",
    count: 35,
    growth: "+45% vs last week",
    isSpike: true,
    quotes: [
      "Prospect wants SSO SAML integration before signing the enterprise tier.",
      "Enterprise customer security team blocked rollout due to missing Okta SSO.",
    ],
  },
  {
    id: "th-4",
    name: "Billing Timeout PDF Bug",
    count: 19,
    growth: "+15% vs last week",
    isSpike: false,
    quotes: [
      "Billing page keeps timing out when I try to download PDF invoice for finance audit.",
    ],
  },
];

function TrendsContent() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role?.toUpperCase() || "VIEWER";

  const canViewTrends = hasPermission(userRole, "trends:view");

  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");
  const [selectedTheme, setSelectedTheme] = useState<SpikingTheme | null>(themeTrendsData[0]);

  useEffect(() => {
    if (themeParam) {
      const match = themeTrendsData.find((t) => t.name.toLowerCase() === themeParam.toLowerCase());
      if (match) {
        setSelectedTheme(match);
      }
    }
  }, [themeParam]);

  if (!canViewTrends) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
              <span>Theme Trends & Spike Detection</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Automated velocity monitoring surfacing emerging customer friction
            </p>
          </div>
        </div>

        <Card className="p-12 text-center space-y-4 max-w-xl mx-auto border-amber-500/30 bg-amber-500/5">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">403 Forbidden — Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access to <strong>AI Theme Clusters & Velocity Monitoring</strong> is restricted according to the enterprise RBAC permission matrix. Only <strong>Owner, Admin, Manager, and Analyst</strong> roles are authorized to view theme intelligence.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            <span>Theme Trends & Spike Detection</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated velocity monitoring surfacing emerging customer friction before it impacts churn
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-4 h-4" />
          <span>2 Active Spikes Detected</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Theme List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">
            Tracked Theme Clusters ({themeTrendsData.length})
          </h3>

          {themeTrendsData.map((t) => {
            const isSelected = selectedTheme?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTheme(t)}
                className={`p-5 rounded-2xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-slate-900 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    {t.name}
                  </h4>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition ${isSelected ? "text-emerald-400 translate-x-1" : ""}`} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">{t.count} Mentions</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      t.isSpike
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {t.growth}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Theme Drill-Down Details */}
        <div className="lg:col-span-2">
          {selectedTheme ? (
            <Card className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span>{selectedTheme.name}</span>
                    {selectedTheme.isSpike && (
                      <span className="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                        CRITICAL SPIKE
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedTheme.count} feedback items clustered • Velocity: {selectedTheme.growth}
                  </p>
                </div>
              </div>

              {/* Quotes Drill-down */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Sample Customer Quotes in Cluster ({selectedTheme.quotes.length})
                </h4>

                {selectedTheme.quotes.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-xs text-slate-300 italic">&quot;{q}&quot;</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span>Verified Customer Quote</span>
                      <span className="text-emerald-400 font-mono">Confidence: 94.2%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              Select a theme from the left to view quote drill-downs.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-white font-mono text-xs">Loading theme trends...</div>}>
        <TrendsContent />
      </Suspense>
    </DashboardLayout>
  );
}
