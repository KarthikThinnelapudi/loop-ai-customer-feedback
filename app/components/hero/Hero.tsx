"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Play, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import MotionWrapper from "@/components/common/MotionWrapper";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
      {/* Badge */}
      <MotionWrapper
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium backdrop-blur-md mb-8"
      >
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span>Enterprise AI Feedback Intelligence</span>
        <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold">v2.0</span>
      </MotionWrapper>

      {/* Main Headline */}
      <MotionWrapper
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.1]">
          Close the Loop on <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Customer Feedback
          </span>
        </h1>
      </MotionWrapper>

      {/* Subtitle */}
      <MotionWrapper
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal"
      >
        <p>
          LOOP turns scattered tickets, reviews, NPS surveys, and sales notes into ranked, evidence-backed insights and actionable product decisions.
        </p>
      </MotionWrapper>

      {/* Action Buttons */}
      <MotionWrapper
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6"
      >
        <Link
          href="/signup"
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-base shadow-[0_0_35px_rgba(16,185,129,0.3)] hover:shadow-[0_0_45px_rgba(16,185,129,0.5)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <a
          href="#dashboard-preview"
          className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 font-semibold text-base backdrop-blur-xl hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current text-emerald-400" />
          <span>Explore Demo</span>
        </a>
      </MotionWrapper>

      {/* Metrics Counter Pill */}
      <MotionWrapper
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto p-6 rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-white">
            <Zap className="w-6 h-6 text-emerald-400" />
            <span>120K+</span>
          </div>
          <span className="text-sm text-slate-400 mt-1">Feedback Items Parsed</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-white">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>99.4%</span>
          </div>
          <span className="text-sm text-slate-400 mt-1">Classification Accuracy</span>
        </div>

        <div className="col-span-2 md:col-span-1 flex flex-col items-center">
          <div className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-white">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>500+</span>
          </div>
          <span className="text-sm text-slate-400 mt-1">Product Teams Empowered</span>
        </div>
      </MotionWrapper>
    </section>
  );
}

