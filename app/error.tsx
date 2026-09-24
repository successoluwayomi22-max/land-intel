"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Telemetry logging
    console.error("LandIntel Global Error Boundary caught exception:", error);
  }, [error]);

  const copyDigest = () => {
    const diagnostic = `Error: ${error.message}\nDigest: ${error.digest || "N/A"}\nTimestamp: ${new Date().toISOString()}`;
    navigator.clipboard?.writeText(diagnostic);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle background radar glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06)_0,transparent_70%)] pointer-events-none" />

      <div className="max-w-lg w-full space-y-6 text-center relative z-10 bg-gradient-to-b from-slate-900/90 to-[#070B16] border border-rose-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Glowing Alert Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-wider">
            HTTP 500 • RUNTIME EXCEPTION
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-white tracking-tight">
            Unexpected System Interruption
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            An unexpected error occurred while processing cadastral records or rendering telemetry. The incident has been
            logged in our central error telemetry registry.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="primary"
            size="md"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reload & Try Again</span>
          </Button>

          <Link href="/dashboard">
            <Button
              variant="outline-dark"
              size="md"
              className="border-slate-700 text-slate-100 hover:text-white text-xs bg-slate-900/95 font-semibold"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </div>

        {/* Collapsible Diagnostic Payload */}
        <div className="pt-3 border-t border-slate-800/80 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center justify-between w-full p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 transition-colors cursor-pointer"
          >
            <span>Technical Diagnostics ({error.digest ? `Digest: ${error.digest}` : "No Digest"})</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-2">
              <div className="text-rose-400 font-semibold break-words">{error.message || "Unknown error"}</div>
              {error.stack && (
                <pre className="text-[10px] text-slate-500 max-h-36 overflow-y-auto whitespace-pre-wrap leading-tight">
                  {error.stack}
                </pre>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={copyDigest}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Diagnostics"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
