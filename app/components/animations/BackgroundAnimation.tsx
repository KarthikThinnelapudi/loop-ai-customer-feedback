"use client";

import { motion } from "framer-motion";

export default function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Aurora Mesh Gradient Layers */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[160px] animate-pulse-glow" />
      <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] bg-gradient-to-bl from-teal-400/15 via-cyan-500/10 to-transparent rounded-full blur-[180px] animate-pulse-glow" />
      <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-600/15 via-emerald-400/10 to-transparent rounded-full blur-[160px] animate-pulse-glow" />

      {/* Floating Glowing Particle Orbs */}
      <motion.div
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full bg-emerald-400/10 blur-[100px]"
      />

      <motion.div
        animate={{
          y: [20, -20, 20],
          x: [15, -15, 15],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-cyan-400/10 blur-[120px]"
      />

      {/* Radial AI Network Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />

      {/* Moving Light Beam overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/80 pointer-events-none" />
    </div>
  );
}

