"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium py-2">
      <Link href="/dashboard" className="hover:text-emerald-400 flex items-center gap-1 transition">
        <Home className="w-3.5 h-3.5" />
        <span>Dashboard</span>
      </Link>

      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        const formatted = seg.replace("-", " ").toUpperCase();

        if (seg === "dashboard") return null;

        return (
          <div key={href} className="flex items-center gap-2">
            <ChevronRight className="w-3 h-3 text-slate-600" />
            {isLast ? (
              <span className="text-emerald-400 font-semibold font-mono">{formatted}</span>
            ) : (
              <Link href={href} className="hover:text-emerald-400 transition font-mono">
                {formatted}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
