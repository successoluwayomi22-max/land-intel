"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WifiOff, Wifi, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export const ConnectionStatus: React.FC = () => {
  const { t } = useLocale();
  const [isOnline, setIsOnline] = useState(true);
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredToast(true);
      const timer = setTimeout(() => setShowRestoredToast(false), 4500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredToast(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Heartbeat check every 30s
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("/api/health", { method: "HEAD", cache: "no-store", signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok && !isOnline) {
          handleOnline();
        }
      } catch {
        // Can be offline or connection throttled
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/health", { method: "HEAD", cache: "no-store", signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        setIsOnline(true);
        setShowRestoredToast(true);
        setTimeout(() => setShowRestoredToast(false), 4500);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      {/* 1. Offline Alert Banner (Sticky at top when disconnected) */}
      {!isOnline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-50 bg-rose-600/95 text-white backdrop-blur-md px-4 py-2.5 shadow-lg border-b border-rose-700/80 transition-all duration-300 animate-in slide-in-from-top"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
              <div className="flex items-center gap-1.5 font-bold">
                <WifiOff className="w-4 h-4" />
                <span>{t("offlineNotice") || "Connection Lost"}</span>
              </div>
              <span className="hidden sm:inline text-rose-100 opacity-90">
                — {t("offlineSubtitle") || "You are currently browsing offline. Local data is preserved."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={checking}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-rose-700 font-bold hover:bg-rose-50 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
                <span>{checking ? (t("reconnecting") || "Checking...") : (t("retryConnection") || "Retry Connection")}</span>
              </button>

              <Link
                href="/offline"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-700/60 hover:bg-rose-700 text-white font-semibold transition-colors"
              >
                <span>{t("viewOfflinePage") || "Offline Center"}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Connection Restored Toast Banner */}
      {showRestoredToast && isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-emerald-500 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span>{t("backOnline") || "Connection Restored! You are back online."}</span>
        </div>
      )}
    </>
  );
};
