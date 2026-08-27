"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, Home, LayoutDashboard, Layers, DollarSign, HelpCircle } from "lucide-react";

const desktopNav = [
  { title: "Features", href: "#features" },
  { title: "Dashboard", href: "#dashboard-preview" },
  { title: "Use Cases", href: "#use-cases" },
  { title: "Pricing", href: "#pricing" },
  { title: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Esc key listener & body scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop Navigation Header Items */}
      <div className="hidden lg:flex items-center gap-8">
        {desktopNav.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition"
          >
            {item.title}
          </a>
        ))}
      </div>

      {/* Desktop Auth Buttons */}
      <div className="hidden lg:flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl transition"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition"
        >
          Get Started Free
        </Link>
      </div>

      {/* Mobile Hamburger Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation Menu"
        className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white shadow-lg transition hover:bg-slate-800 shrink-0"
      >
        {isOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer Slide-over */}
      <aside
        className={`fixed top-0 right-0 z-50 lg:hidden h-screen w-[320px] max-w-[85vw] bg-slate-950 border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out p-6 flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" /> Navigation
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-3">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 py-2 text-sm font-semibold border-b border-slate-900"
            >
              <Home className="w-4 h-4 text-emerald-400" /> Home
            </Link>
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 py-2 text-sm font-semibold border-b border-slate-900"
            >
              <Layers className="w-4 h-4 text-teal-400" /> Features
            </a>
            <a
              href="#dashboard-preview"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 py-2 text-sm font-semibold border-b border-slate-900"
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Dashboard Preview
            </a>
            <a
              href="#pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 py-2 text-sm font-semibold border-b border-slate-900"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" /> Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-slate-300 hover:text-emerald-400 py-2 text-sm font-semibold"
            >
              <HelpCircle className="w-4 h-4 text-purple-400" /> FAQ
            </a>
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-800/80">
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="block text-center py-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 font-semibold text-sm hover:bg-slate-800 transition"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            onClick={() => setIsOpen(false)}
            className="block text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition"
          >
            Get Started Free
          </Link>
        </div>
      </aside>
    </>
  );
}