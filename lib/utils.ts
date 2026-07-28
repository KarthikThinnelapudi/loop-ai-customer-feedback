import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSentimentScore(score: number): string {
  if (score > 0) return `+${(score * 100).toFixed(0)}%`;
  return `${(score * 100).toFixed(0)}%`;
}

export function getSentimentColor(sentiment: string) {
  switch (sentiment.toUpperCase()) {
    case "POS":
    case "POSITIVE":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "NEG":
    case "NEGATIVE":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    default:
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }
}

export function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIONED":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "REVIEWED":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    default:
      return "bg-slate-700/50 text-slate-300 border-slate-600/50";
  }
}
