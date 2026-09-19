"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  code?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showHomeLink?: boolean;
  supportLink?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred while processing cadastral data. Our telemetry service has logged the incident.",
  code = "ERR_RUNTIME_EXCEPTION",
  onRetry,
  isRetrying = false,
  showHomeLink = true,
  supportLink = "mailto:support@diasporaland.ai",
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`p-6 sm:p-10 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#070B16] border border-rose-500/20 text-center space-y-5 max-w-lg mx-auto shadow-2xl ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
        <AlertTriangle className="w-7 h-7 animate-pulse" />
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-wider">
          {code}
        </span>
        <h3 className="text-lg sm:text-xl font-bold font-heading text-white tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">{description}</p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            isLoading={isRetrying}
            variant="primary"
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Try Again</span>
          </Button>
        )}

        {showHomeLink && (
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 text-slate-300 hover:text-white text-xs bg-slate-900"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              <span>Dashboard</span>
            </Button>
          </Link>
        )}

        {supportLink && (
          <a href={supportLink} className="inline-flex">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-amber-400 text-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>Contact Support</span>
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
