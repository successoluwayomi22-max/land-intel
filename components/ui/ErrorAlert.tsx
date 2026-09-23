"use client";

import React from "react";
import { AlertCircle, AlertTriangle, XCircle, ShieldAlert, RefreshCw, X } from "lucide-react";

export type ErrorSeverity = "error" | "warning" | "destructive" | "info";

export interface ErrorAlertProps {
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
  const config = {
    error: {
      container: "bg-red-50/95 border-l-4 border-l-red-600 border-red-200 text-slate-900 shadow-xs",
      titleColor: "text-red-950 font-bold",
      textColor: "text-slate-800",
      iconColor: "text-red-600",
      badge: "bg-red-100 text-red-900 border-red-300",
      btn: "bg-red-100 hover:bg-red-200 text-red-900 border-red-300",
      closeBtn: "text-slate-400 hover:text-slate-800",
      Icon: AlertCircle,
    },
    warning: {
      container: "bg-amber-50/95 border-l-4 border-l-amber-500 border-amber-200 text-slate-900 shadow-xs",
      titleColor: "text-amber-950 font-bold",
      textColor: "text-slate-800",
      iconColor: "text-amber-600",
      badge: "bg-amber-100 text-amber-900 border-amber-300",
      btn: "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300",
      closeBtn: "text-slate-400 hover:text-slate-800",
      Icon: AlertTriangle,
    },
    destructive: {
      container: "bg-red-100/90 border-l-4 border-l-red-700 border-red-300 text-slate-950 shadow-xs",
      titleColor: "text-red-950 font-bold",
      textColor: "text-slate-900",
      iconColor: "text-red-700",
      badge: "bg-red-200 text-red-950 border-red-400",
      btn: "bg-red-700 hover:bg-red-800 text-white",
      closeBtn: "text-slate-400 hover:text-slate-800",
      Icon: XCircle,
    },
    info: {
      container: "bg-blue-50/95 border-l-4 border-l-blue-600 border-blue-200 text-slate-900 shadow-xs",
      titleColor: "text-blue-950 font-bold",
      textColor: "text-slate-800",
      iconColor: "text-blue-600",
      badge: "bg-blue-100 text-blue-900 border-blue-300",
      btn: "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300",
      closeBtn: "text-slate-400 hover:text-slate-800",
      Icon: ShieldAlert,
    },
  }[severity];

  const IconComponent = config.Icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative p-4 rounded-xl border transition-all duration-200 ${config.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {title && (
              <span className={`text-sm tracking-tight ${config.titleColor}`}>
                {title}
              </span>
            )}
            {code && (
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${config.badge}`}>
                {code}
              </span>
            )}
          </div>

          <p className={`text-xs sm:text-sm leading-relaxed font-medium ${config.textColor} break-words`}>
            {message}
          </p>

          {(onRetry || onAction) && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${config.btn}`}
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                  <span>{isRetrying ? "Retrying..." : "Retry"}</span>
                </button>
              )}
              {actionLabel && onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className="text-xs font-bold text-brand-blue underline underline-offset-2 hover:text-blue-800 cursor-pointer"
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
            aria-label="Dismiss notice"
            className={`shrink-0 p-1 ${config.closeBtn} rounded transition-colors cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
