"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Ban,
  Activity,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Search,
  Lock,
  Unlock,
  Radio,
  FileCheck2,
  Trash2,
  Eye,
} from "lucide-react";
import { SecuritySeverity, IPSecurityState, MalwareState, IncidentStatus } from "@/lib/security/types";
import { ProviderStatus } from "@/lib/observability/types";

// 1. Severity Indicator Component (Accessibility: Color + Icon + Text)
export function SeverityBadge({ severity }: { severity: SecuritySeverity }) {
  switch (severity) {
    case "CRITICAL":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40"
          aria-label="Critical Severity"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
          <span>CRITICAL</span>
        </span>
      );
    case "HIGH":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
          aria-label="High Severity"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>HIGH</span>
        </span>
      );
    case "MEDIUM":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
          aria-label="Medium Severity"
        >
          <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0" aria-hidden="true" />
          <span>MEDIUM</span>
        </span>
      );
    case "LOW":
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40"
          aria-label="Low Severity"
        >
          <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
          <span>LOW</span>
        </span>
      );
    case "INFO":
    default:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700"
          aria-label="Informational Severity"
        >
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span>INFO</span>
        </span>
      );
  }
}

// 2. IP Security State Badge
export function IPStatusBadge({ status }: { status: IPSecurityState }) {
  switch (status) {
    case "ALLOW":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>ALLOWLIST</span>
        </span>
      );
    case "PERMANENTLY_BLOCKED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse">
          <Ban className="w-3 h-3 text-rose-400" />
          <span>PERMANENT BLOCK</span>
        </span>
      );
    case "TEMPORARILY_BLOCKED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>TEMP BLOCKED</span>
        </span>
      );
    case "RATE_LIMIT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
          <Clock className="w-3 h-3 text-orange-400" />
          <span>RATE LIMITED</span>
        </span>
      );
    case "CHALLENGE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Radio className="w-3 h-3 text-purple-400" />
          <span>CHALLENGE</span>
        </span>
      );
    case "MONITOR":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <Activity className="w-3 h-3 text-slate-400" />
          <span>MONITOR</span>
        </span>
      );
  }
}

// 3. Provider Status Indicator
export function ProviderStatusBadge({ status }: { status: ProviderStatus }) {
  switch (status) {
    case "HEALTHY":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>OPERATIONAL</span>
        </span>
      );
    case "DEGRADED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>DEGRADED</span>
        </span>
      );
    case "UNAVAILABLE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/25 text-rose-400 border border-rose-500/40">
          <XCircle className="w-3 h-3" />
          <span>UNAVAILABLE</span>
        </span>
      );
    case "NOT_CONFIGURED":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <Info className="w-3 h-3" />
          <span>NOT CONFIGURED</span>
        </span>
      );
  }
}

// 4. Enterprise SOC Metric Card
export function SecurityMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  variant?: "default" | "critical" | "warning" | "success";
  trend?: string;
}) {
  const getBorderColor = () => {
    switch (variant) {
      case "critical":
        return "border-rose-500/40 bg-rose-950/20 text-rose-300";
      case "warning":
        return "border-amber-500/40 bg-amber-950/20 text-amber-300";
      case "success":
        return "border-emerald-500/40 bg-emerald-950/20 text-emerald-300";
      default:
        return "border-slate-800 bg-slate-900/80 text-slate-300";
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getBorderColor()} shadow-lg flex flex-col justify-between`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
          <span>{value}</span>
          {trend && <span className="text-xs font-mono font-medium text-slate-400">{trend}</span>}
        </div>
        {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// 5. IP Action Modal for Dangerous Security Actions
export function IPActionModal({
  isOpen,
  ip,
  currentState,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  ip: string;
  currentState: IPSecurityState;
  onClose: () => void;
  onConfirm: (action: "BLOCK" | "UNBLOCK" | "EXTEND" | "ALLOWLIST", reason: string, durationMinutes?: number) => void;
}) {
  const [action, setAction] = useState<"BLOCK" | "UNBLOCK" | "EXTEND" | "ALLOWLIST">("BLOCK");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    await onConfirm(action, reason.trim(), action === "UNBLOCK" ? undefined : duration);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="w-5 h-5 text-amber-500" />
            <span>IP Security Enforcement: {ip}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Action</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAction("BLOCK")}
                className={`py-2 px-3 rounded-lg border font-mono font-bold text-center transition-colors ${
                  action === "BLOCK"
                    ? "bg-rose-500/30 border-rose-500 text-rose-200"
                    : "bg-slate-800/80 border-slate-700 text-slate-300"
                }`}
              >
                Temporary Block
              </button>
              <button
                type="button"
                onClick={() => setAction("UNBLOCK")}
                className={`py-2 px-3 rounded-lg border font-mono font-bold text-center transition-colors ${
                  action === "UNBLOCK"
                    ? "bg-emerald-500/30 border-emerald-500 text-emerald-200"
                    : "bg-slate-800/80 border-slate-700 text-slate-300"
                }`}
              >
                Lift Restriction (Unblock)
              </button>
              <button
                type="button"
                onClick={() => setAction("EXTEND")}
                className={`py-2 px-3 rounded-lg border font-mono font-bold text-center transition-colors ${
                  action === "EXTEND"
                    ? "bg-amber-500/30 border-amber-500 text-amber-200"
                    : "bg-slate-800/80 border-slate-700 text-slate-300"
                }`}
              >
                Extend Block Duration
              </button>
              <button
                type="button"
                onClick={() => setAction("ALLOWLIST")}
                className={`py-2 px-3 rounded-lg border font-mono font-bold text-center transition-colors ${
                  action === "ALLOWLIST"
                    ? "bg-blue-500/30 border-blue-500 text-blue-200"
                    : "bg-slate-800/80 border-slate-700 text-slate-300"
                }`}
              >
                Permanent Allowlist
              </button>
            </div>
          </div>

          {action !== "UNBLOCK" && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Duration (Minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={360}>6 Hours</option>
                <option value={1440}>24 Hours</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Statutory Justification / Audit Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Repeated automated endpoint enumeration; manual block requested by security administrator."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Every manual action is cryptographically recorded in the platform audit trail.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-50"
            >
              {submitting ? "Applying..." : "Confirm & Apply Action"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
