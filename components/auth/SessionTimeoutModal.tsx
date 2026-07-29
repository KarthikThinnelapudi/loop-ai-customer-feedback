"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function SessionTimeoutModal() {
  const router = useRouter();
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      clearInterval(countdownInterval);
      setShowWarning(false);
      setSecondsRemaining(120);

      // Trigger warning after 28 minutes (1680000 ms) of inactivity
      inactivityTimer = setTimeout(() => {
        setShowWarning(true);
        setSecondsRemaining(120);

        countdownInterval = setInterval(() => {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setShowWarning(false);
              signOut({ callbackUrl: "/login?expired=true" });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 28 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      clearInterval(countdownInterval);
      events.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [router]);

  const handleExtendSession = () => {
    setShowWarning(false);
    setSecondsRemaining(120);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl p-6 shadow-2xl z-10 text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <h3 className="text-xl font-extrabold text-white">Session Inactivity Warning</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            You have been inactive for 28 minutes. For workspace security, your session will expire in:
          </p>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-3xl font-bold font-mono text-amber-400">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLogout}
              className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Now</span>
            </button>

            <button
              onClick={handleExtendSession}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Extend Session</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
