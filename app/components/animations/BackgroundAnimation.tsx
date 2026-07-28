"use client";

export default function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] animate-pulse-glow" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[160px] animate-pulse-glow" />
      <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[150px] animate-pulse-glow" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
    </div>
  );
}
