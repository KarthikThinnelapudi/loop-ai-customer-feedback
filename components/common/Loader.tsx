"use client";

export default function Loader({ text = "Loading intelligence data..." }: { text?: string }) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-xs text-slate-400 font-mono">{text}</p>
    </div>
  );
}
