"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, RefreshCw, Check, ShieldAlert, AlertTriangle } from "lucide-react";
import Modal from "./Modal";

interface SecretKeyMaskerProps {
  label?: string;
  secretKey: string;
  prefix?: string;
  suffixLength?: number;
  userRole?: string;
  onRegenerate?: () => void;
}

export default function SecretKeyMasker({
  label = "Workspace API Key",
  secretKey,
  prefix = "loop_live_sk_",
  suffixLength = 4,
  userRole = "ADMIN",
  onRegenerate,
}: SecretKeyMaskerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const isAuthorized = userRole === "ADMIN" || userRole === "OWNER";

  // Format masked key: e.g. loop_live_sk_************************4819
  const getMaskedKey = () => {
    if (!isAuthorized) {
      return "••••••••••••••••••••••••••••••••";
    }
    const cleanKey = secretKey.startsWith(prefix) ? secretKey.slice(prefix.length) : secretKey;
    const visibleSuffix = cleanKey.slice(-suffixLength);
    const maskedMiddle = "*".repeat(Math.max(16, cleanKey.length - suffixLength));
    return `${prefix}${maskedMiddle}${visibleSuffix}`;
  };

  const handleCopy = async () => {
    if (!isAuthorized) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
    }
  };

  const handleRegenerateConfirm = () => {
    setRegenerating(true);
    setTimeout(() => {
      setRegenerating(false);
      setShowRegenerateModal(false);
      if (onRegenerate) onRegenerate();
    }, 800);
  };

  return (
    <div className="space-y-3">
      {/* Label and Warning Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Treat key like a password. Do not share publicly.</span>
        </span>
      </div>

      {/* Masked Secret Key Control Container */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
          <span className="text-slate-300 truncate select-none">
            {!isAuthorized
              ? "••••••••••••••••••••"
              : isVisible
              ? secretKey
              : getMaskedKey()}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isAuthorized ? (
            <>
              {/* Show/Hide Toggle */}
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                title={isVisible ? "Hide API key" : "Show API key"}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5"
              >
                {isVisible ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-sans">Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-sans">Reveal</span>
                  </>
                )}
              </button>

              {/* Copy Key Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 font-sans font-semibold text-xs"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy API Key</span>
                  </>
                )}
              </button>

              {/* Regenerate Key Button */}
              <button
                type="button"
                onClick={() => setShowRegenerateModal(true)}
                title="Regenerate key"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition flex items-center gap-1 font-sans text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Regenerate</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-sans">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Only Workspace Owners can view API Keys.</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Regenerating API Key */}
      <Modal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        title="Regenerate Integration API Key"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Warning: Unreversible Security Action</p>
              <p className="mt-1 leading-relaxed">
                Regenerating this key will immediately revoke access for all active webhooks (Intercom, Slack, Zapier, Typeform) currently using the old key.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRegenerateModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRegenerateConfirm}
              disabled={regenerating}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
              <span>{regenerating ? "Revoking & Generating..." : "Confirm & Regenerate Key"}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
