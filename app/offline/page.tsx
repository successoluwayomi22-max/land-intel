"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Radio,
} from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { Button } from "@/components/ui/Button";
import { LandIntelLogo } from "@/components/ui/LandIntelLogo";

export default function OfflinePage() {
  const { t } = useLocale();
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const updateOnlineStatus = () => setIsOnline(navigator.onLine);
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);

      return () => {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
      };
    }
  }, []);

  const handleTestConnection = async () => {
    setChecking(true);
    setPingResult(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setIsOnline(true);
        setPingResult("SUCCESS");
      } else {
        setIsOnline(false);
        setPingResult("FAILED");
      }
    } catch {
      setIsOnline(false);
      setPingResult("FAILED");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LandIntelLogo href="/" size="sm" variant="dark" />
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
            Offline Center
          </span>
        </div>

        {/* High-End Locale Switcher on Offline Page */}
        <div className="flex items-center gap-3">
          <LocaleSelector variant="dark" />
        </div>
      </header>

      {/* Main Content Center */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center my-auto">
        {/* Animated Status Icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl relative">
            {isOnline ? (
              <Wifi className="w-12 h-12 text-emerald-400 animate-bounce" />
            ) : (
              <WifiOff className="w-12 h-12 text-rose-500" />
            )}
            {/* Pulsing ring indicator */}
            <span
              className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 ${
                isOnline ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-current" />
            </span>
          </div>
        </div>

        {/* Dynamic Titles */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/90 border border-slate-800">
            <Radio className={`w-3.5 h-3.5 ${isOnline ? "text-emerald-400 animate-pulse" : "text-rose-400"}`} />
            <span className={isOnline ? "text-emerald-400" : "text-rose-400"}>
              {isOnline ? (t("connectionActive") || "Internet Connected") : (t("offlineNotice") || "Connection Disconnected")}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight">
            {isOnline ? (t("backOnline") || "Connection Restored!") : (t("offlineTitle") || "You Are Currently Offline")}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            {isOnline
              ? "Your internet link is established and authenticated. You can safely continue using all LandIntel features."
              : (t("offlineSubtitle") ||
                "We detected that your internet connection is down. Don't worry, your progress and uploaded documents are cached safely on your device.")}
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={checking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>
              {checking
                ? (t("reconnecting") || "Checking connection...")
                : (t("retryConnection") || "Retry Connection Now")}
            </span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("returnHome") || "Return to Main Site"}</span>
          </Link>
        </div>

        {/* Ping Result Feedback */}
        {pingResult === "SUCCESS" && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold max-w-md mx-auto flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Server responded with HTTP 200. Connectivity confirmed!</span>
          </div>
        )}

        {pingResult === "FAILED" && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold max-w-md mx-auto flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Unable to reach LandIntel servers. Please check your Wi-Fi or router.</span>
          </div>
        )}

        {/* Diagnostic Checklist Cards */}
        <div className="mt-12 text-left bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-heading mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t("offlineTipsTitle") || "Troubleshooting Connection Tips"}</span>
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <span>{t("offlineTip1") || "Ensure your Wi-Fi or cellular mobile data is enabled."}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <span>{t("offlineTip2") || "Check if your router or local gateway has internet access."}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <span>{t("offlineTip3") || "If using a VPN or proxy, verify it is responding properly."}</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/30 px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span suppressHydrationWarning>© {new Date().getFullYear()} LandIntel Cadastral Intelligence.</span>
          <span>Local offline state protected by browser sandbox.</span>
        </div>
      </footer>
    </div>
  );
}
