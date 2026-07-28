"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export default function Card({ children, className, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 transition-all duration-300",
        glow && "shadow-[0_0_50px_rgba(16,185,129,0.12)] border-emerald-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
