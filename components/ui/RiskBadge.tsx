import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

export interface RiskBadgeProps {
  level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL" | string;
  className?: string;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  className = "",
  showIcon = true,
}) => {
  const normLevel = level.toUpperCase();

  switch (normLevel) {
    case "LOW":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          {showIcon && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          <span>LOW RISK</span>
        </span>
      );
    case "MODERATE":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          {showIcon && <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
          <span>MODERATE RISK</span>
        </span>
      );
    case "ELEVATED":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          <span>ELEVATED RISK</span>
        </span>
      );
    case "HIGH":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
          <span>HIGH RISK</span>
        </span>
      );
    case "CRITICAL":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
        >
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          <span>CRITICAL RISK</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          <span>{normLevel}</span>
        </span>
      );
  }
};
