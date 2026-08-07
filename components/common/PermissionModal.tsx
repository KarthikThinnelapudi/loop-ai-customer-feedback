"use client";

import Modal from "./Modal";
import { ShieldAlert, Lock } from "lucide-react";

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  requiredRole?: string;
}

export default function PermissionModal({
  isOpen,
  onClose,
  title = "Access Restricted",
  message = "You don't have permission to perform this action or access this feature.",
  requiredRole,
}: PermissionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5 text-center p-2">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Role Permission Required</span>
          </h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {message}
          </p>
          {requiredRole && (
            <p className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block mt-1">
              Required Role: {requiredRole}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Understand & Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
