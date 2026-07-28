"use client";

import { motion } from "framer-motion";

export default function LoopLogo() {
  return (
    <motion.div
      className="flex items-center gap-2 cursor-pointer select-none"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="relative"
      >
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/40 blur-xl animate-pulse"></div>

        <svg
          width="36"
          height="36"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative"
        >
          {/* Outer Ring */}
          <circle
            cx="32"
            cy="32"
            r="24"
            stroke="#10B981"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="120 18"
          />

          {/* Middle Ring */}
          <circle
            cx="32"
            cy="32"
            r="16"
            stroke="#059669"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="72 10"
          />

          {/* AI Core */}
          <motion.circle
            cx="32"
            cy="32"
            r="6"
            fill="#047857"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />

          {/* Orbit Dot */}
          <motion.circle
            cx="56"
            cy="32"
            r="3"
            fill="#6EE7B7"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              transformOrigin: "32px 32px",
            }}
          />
        </svg>
      </motion.div>

      {/* Text */}
      <div className="flex flex-col whitespace-nowrap">
        <h1
          className="text-xl md:text-2xl font-bold tracking-wide text-white">
          <span className="text-white">LO</span>
          <span className="text-emerald-600">OP</span>
        </h1>

        <p className="mt-1 text-[10px] text-slate-400 uppercase whitespace-nowrap">
          AI Feedback Intelligence
        </p>
      </div>
    </motion.div>
  );
}