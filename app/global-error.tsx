"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { captureException } from "@/lib/telemetry";

export default function GlobalFatalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { action: "FATAL_ROOT_CRASH", metadata: { digest: error.digest } });
  }, [error]);
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-900 border border-rose-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 uppercase">
              CRITICAL CORE ERROR
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Application Failure</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              A fatal error prevented the application layout from rendering. You can attempt to reload the core engine.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
