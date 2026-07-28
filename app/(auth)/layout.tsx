import BackgroundAnimation from "../components/animations/BackgroundAnimation";
import LoopLogo from "../components/logo/LoopLogo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      <BackgroundAnimation />

      {/* Header */}
      <header className="pt-8 px-8 flex items-center justify-between relative z-10">
        <Link href="/">
          <LoopLogo />
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-emerald-400 transition font-medium"
        >
          ← Back to home
        </Link>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 relative z-10 font-mono">
        © 2026 LOOP AI. Enterprise Customer Intelligence.
      </footer>
    </div>
  );
}
