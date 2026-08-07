"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type PanelType = "search" | "notif" | "profile" | null;

interface UseDismissablePanelOptions {
  onPanelChange?: (activePanel: PanelType) => void;
}

export function useDismissablePanel(options: UseDismissablePanelOptions = {}) {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openPanel = useCallback(
    (panel: PanelType) => {
      setActivePanel((prev) => {
        const next = prev === panel ? null : panel;
        if (options.onPanelChange) options.onPanelChange(next);
        return next;
      });
    },
    [options]
  );

  const closeAll = useCallback(() => {
    setActivePanel(null);
    if (options.onPanelChange) options.onPanelChange(null);
  }, [options]);

  // Handle ESC key and Click Outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAll();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };

    if (activePanel) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePanel, closeAll]);

  // Focus input automatically when search panel opens
  useEffect(() => {
    if (activePanel === "search") {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activePanel]);

  return {
    activePanel,
    openPanel,
    closeAll,
    containerRef,
    searchInputRef,
    isSearchOpen: activePanel === "search",
    isNotifOpen: activePanel === "notif",
    isProfileOpen: activePanel === "profile",
  };
}
