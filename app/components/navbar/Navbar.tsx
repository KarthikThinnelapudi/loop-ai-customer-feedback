"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const menuItems = [
  {
    title: "Home",
    href: "#home",
    icon: "🏠",
  },
  {
    title: "Product",
    icon: "✨",
    children: [
      { title: "Dashboard", href: "#dashboard" },
      { title: "AI Insights", href: "#ai-insights" },
      { title: "Features", href: "#features" },
      { title: "Use Cases", href: "#use-cases" },
    ],
  },
  {
    title: "Resources",
    icon: "📚",
    children: [
      { title: "How It Works", href: "#how-it-works" },
      { title: "Pricing", href: "#pricing" },
      { title: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    icon: "🏢",
    children: [
      { title: "Contact", href: "#contact" },
    ],
  },
];

const authItems = [
  {
    title: "Sign In",
    href: "/auth/signin",
    icon: "🔐",
  },
  {
    title: "Sign Up",
    href: "/auth/signup",
    icon: "📝",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-[99999] flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-700 text-white shadow-xl transition hover:bg-slate-800"
      >
        <span className="text-3xl font-bold">
          {isOpen ? "✕" : "☰"}
        </span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[99997] bg-black/70"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[99998]
        h-screen
        w-[380px]
        max-w-[90vw]
        bg-[#020617]
        border-l border-slate-800
        shadow-2xl
        transition-transform duration-300 ease-in-out
        ${
          isOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="border-b border-slate-800 px-8 py-7">

          <h2 className="text-3xl font-bold text-white">
            Menu
          </h2>

        </div>

        <div className="h-[calc(100vh-96px)] overflow-y-auto px-8 py-8">

<div className="space-y-8">

  {/* Home */}
  <Link
    href="#home"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-4 rounded-xl px-4 py-4 text-xl font-semibold text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-300"
  >
    <span className="text-2xl">🏠</span>
    Home
  </Link>

  <hr className="border-slate-800" />

  {/* Product */}
  <div>
    <h3 className="mb-5 flex items-center gap-4 text-2xl font-bold text-emerald-400">
      <span className="text-2xl">✨</span>
      Product
    </h3>

    <div className="ml-8 border-l border-slate-700 pl-6 space-y-4">

      <Link
        href="#dashboard"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        Dashboard
      </Link>

      <Link
        href="#ai-insights"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        AI Insights
      </Link>

      <Link
        href="#features"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        Features
      </Link>

      <Link
        href="#use-cases"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        Use Cases
      </Link>

    </div>
  </div>

  <hr className="border-slate-800" />

  {/* Resources */}
  <div>

    <h3 className="mb-5 flex items-center gap-4 text-2xl font-bold text-emerald-400">
      <span className="text-2xl">📚</span>
      Resources
    </h3>

    <div className="ml-8 border-l border-slate-700 pl-6 space-y-4">

      <Link
        href="#how-it-works"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        How It Works
      </Link>

      <Link
        href="#pricing"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        Pricing
      </Link>

      <Link
        href="#faq"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        FAQ
      </Link>

    </div>

  </div>

  <hr className="border-slate-800" />

  {/* Company */}
  <div>

    <h3 className="mb-5 flex items-center gap-4 text-2xl font-bold text-emerald-400">
      <span className="text-2xl">🏢</span>
      Company
    </h3>

    <div className="ml-8 border-l border-slate-700 pl-6">

      <Link
        href="#contact"
        className="block text-lg text-slate-300 hover:text-emerald-400 transition"
      >
        Contact
      </Link>

    </div>

  </div>

  <hr className="border-slate-800" />

          {/* Auth Section */}
          <div className="mt-8 space-y-4">

            {authItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 rounded-xl px-5 py-4 text-xl font-semibold text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-300"
              >
                <span className="text-2xl">{item.icon}</span>
                {item.title}
              </Link>
            ))}

          </div>

          {/* CTA */}
          <div className="mt-10">

            <Link
              href="/auth/signup"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-5 text-center text-xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-emerald-400 hover:to-emerald-500"
            >
              🚀 Get Started Free
            </Link>

          </div>
          
          </div>

        </div>
      </aside>
    </>
  );
}