import React from "react";
import { RiskBadge } from "./RiskBadge";
import { getPurchaseRecommendation } from "@/lib/ai/types";
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export interface RiskScoreMeterProps {
  score: number;
  level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL" | string;
  explanation?: string;
  breakdown?: {
    documentationScore?: number;
    ownershipScore?: number;
    geographicScore?: number;
    consistencyScore?: number;
  };
  compact?: boolean;
}

export const RiskScoreMeter: React.FC<RiskScoreMeterProps> = ({
  score,
  level,
  explanation,
  breakdown,
  compact = false,
}) => {
  const { t } = useLocale();
  const normScore = Math.max(0, Math.min(100, score));
  const isSynthetic = (explanation || "").toLowerCase().includes("synthetic") || (explanation || "").toLowerCase().includes("placeholder");
  const recommendation = getPurchaseRecommendation(normScore, level, { isSynthetic });

  // Gauge bar color
  const getProgressColor = () => {
    if (normScore > 80) return "bg-rose-600";
    if (normScore > 60) return "bg-orange-500";
    if (normScore > 40) return "bg-amber-500";
    if (normScore > 20) return "bg-blue-600";
    return "bg-emerald-600";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 text-center">
          <span className="text-xl font-bold font-heading text-brand-textPrimary">{normScore}</span>
          <span className="text-[10px] text-brand-textMuted block -mt-1">/100</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <RiskBadge level={level} />
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${recommendation.badgeBg} ${recommendation.badgeText}`}>
              {recommendation.shortVerdict}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-pill h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full ${getProgressColor()} rounded-pill transition-all duration-500`}
              style={{ width: `${normScore}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-brand-border rounded-card p-6 shadow-subtle space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <span className="text-xs font-semibold text-brand-textMuted uppercase tracking-wider block">
            Institutional Risk Assessment
          </span>
          <h3 className="text-lg font-bold text-brand-textPrimary font-heading mt-0.5">
            Due-Diligence Risk Indicator Score
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={level} />
          <span className={`px-2.5 py-1 rounded-pill text-xs font-black shadow-xs tracking-wide ${recommendation.badgeBg} ${recommendation.badgeText} border ${recommendation.badgeBorder}`}>
            {recommendation.shortVerdict}
          </span>
        </div>
      </div>

      {/* Prominent Purchase Recommendation Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${recommendation.bgClass}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {recommendation.verdict === "DO_NOT_BUY" ? (
              <XCircle className="w-6 h-6 text-rose-600" />
            ) : recommendation.verdict === "DO_NOT_BUY_DEFECTIVE" ? (
              <AlertOctagon className="w-6 h-6 text-amber-600" />
            ) : recommendation.verdict === "CONDITIONAL" ? (
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              ACQUISITION DECISION GUIDANCE
            </span>
            <h4 className={`text-base font-extrabold font-heading ${recommendation.colorClass}`}>
              {recommendation.headline}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed max-w-2xl font-medium">
              {recommendation.actionGuidance}
            </p>
          </div>
        </div>

        <div className="sm:text-right shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            VERDICT
          </span>
          <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-black mt-0.5 tracking-wider ${recommendation.badgeBg} ${recommendation.badgeText}`}>
            {recommendation.shortVerdict}
          </span>
        </div>
      </div>

      {/* Score gauge */}
      <div className="py-2 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-5xl font-extrabold font-heading text-brand-textPrimary tracking-tight">
            {normScore}
          </span>
          <span className="text-sm font-medium text-brand-textMuted">/ 100</span>
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="w-full bg-slate-100 rounded-pill h-3.5 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full ${getProgressColor()} rounded-pill transition-all duration-500`}
              style={{ width: `${normScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-semibold text-brand-textMuted px-1">
            <span className="text-emerald-700 font-bold">0 (Low Risk)</span>
            <span className="text-blue-700 font-medium">21 (Moderate)</span>
            <span className="text-amber-700 font-medium">41 (Elevated)</span>
            <span className="text-orange-700 font-medium">61 (High)</span>
            <span className="text-rose-700 font-bold">81+ (Critical - DO NOT BUY)</span>
          </div>
        </div>
      </div>

      {/* Explanatory notes with whitespace preservation */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-brand-textSecondary leading-relaxed space-y-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="font-bold text-brand-textPrimary text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue" />
            AI Cross-Document Due-Diligence Synthesis
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Audited in Real-Time</span>
        </div>
        <div className="whitespace-pre-line text-slate-800 text-xs font-normal">
          {explanation || "Analysis incorporates cross-document verification, cadastral heuristics, and submitted covenants."}
        </div>
      </div>

      {/* Sub-score breakdown */}
      {breakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-brand-textMuted block font-semibold">Documentation Root</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-brand-textPrimary">{breakdown.documentationScore ?? 0}</span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-brand-textMuted block font-semibold">Ownership Lineage</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-brand-textPrimary">{breakdown.ownershipScore ?? 0}</span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-brand-textMuted block font-semibold">Cadastral & Geographic</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-brand-textPrimary">{breakdown.geographicScore ?? 0}</span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-brand-textMuted block font-semibold">Cross-Instrument Consistency</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-brand-textPrimary">{breakdown.consistencyScore ?? 0}</span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Scope & Non-Legal-Advice Warning */}
      <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-lg flex items-start gap-2.5 text-xs text-amber-950">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-amber-900">
          {t("legalDisclaimerRisk") || "Legal Scope Notice: LandIntel provides preliminary algorithmic due diligence to catch document discrepancies, coordinate buffer overlaps, and gazette conflicts. It cannot establish legal ownership or replace registered surveyors and legal counsel."}
        </p>
      </div>
    </div>
  );
};
