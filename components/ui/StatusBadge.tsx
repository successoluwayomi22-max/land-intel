import React from "react";
import { Clock, CheckCircle2, AlertCircle, FileCheck, RefreshCw, XCircle } from "lucide-react";

export interface StatusBadgeProps {
  status:
    | "DRAFT"
    | "UPLOADING"
    | "ANALYZING"
    | "ANALYSIS_COMPLETE"
    | "NEEDS_REVIEW"
    | "REPORT_GENERATED"
    | "COMPLETED"
    | "ERROR"
    | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const normStatus = status.toUpperCase();

  switch (normStatus) {
    case "DRAFT":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Draft</span>
        </span>
      );
    case "UPLOADING":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
          <span>Uploading</span>
        </span>
      );
    case "ANALYZING":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}>
          <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
          <span>Analyzing</span>
        </span>
      );
    case "ANALYSIS_COMPLETE":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Analysis Complete</span>
        </span>
      );
    case "NEEDS_REVIEW":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Needs Review</span>
        </span>
      );
    case "REPORT_GENERATED":
    case "COMPLETED":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300 ${className}`}>
          <FileCheck className="w-3 h-3 text-blue-600" />
          <span>Report Unlocked</span>
        </span>
      );
    case "ERROR":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Error</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <span>{status}</span>
        </span>
      );
  }
};
