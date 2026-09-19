"use client";

import React from "react";
import { AlertCircle, AlertTriangle, XCircle, ShieldAlert, RefreshCw, X } from "lucide-react";

export type ErrorSeverity = "error" | "warning" | "destructive" | "info";

interface ErrorAlertProps {
  title?: string;
  message: string;
  code?: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  isRetrying?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  title,
  message,
  code,
  severity = "error",
  onRetry,
  isRetrying = false,
  actionLabel,
  onAction,
  onDismiss,
  className = "",
}: ErrorAlertProps) {
  const styles = {
    error: {
      bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
      iconColor: "text-rose-400",
      badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      btn: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40",
      Icon: AlertCircle,
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
      iconColor: "text-amber-400",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      btn: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40",
      Icon: AlertTriangle,
    },
    destructive: {
      bg: "bg-red-950/60 border-red-800/80 text-red-200 shadow-lg shadow-red-950/40",
      iconColor: "text-red-400",
      badge: "bg-red-900/60 text-red-200 border-red-700",
      btn: "bg-red-600 hover:bg-red-500 text-white",
      Icon: XCircle,
    },
    info: {
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
      iconColor: "text-blue-400",
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      btn: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-500/40",
      Icon: ShieldAlert,
    },
  }[severity];

  const Icon = styles.Icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative p-3.5 sm:p-4 rounded-xl border backdrop-blur-md transition-all duration-200 ${styles.bg} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${styles.iconColor}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {title && <span className="font-semibold text-xs sm:text-sm tracking-tight text-white">{title}</span>}
            {code && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${styles.badge}`}>
                {code}
              </span>
            )}
          </div>

          <p className="text-xs leading-relaxed opacity-90 break-words">{message}</p>

          {(onRetry || onAction) && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${styles.btn}`}
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                  <span>{isRetrying ? "Retrying..." : "Retry"}</span>
                </button>
              )}
              {actionLabel && onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className="text-[11px] font-bold underline underline-offset-2 hover:opacity-100 opacity-80 cursor-pointer"
                >
                  {actionLabel}
                </button>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className="shrink-0 p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
