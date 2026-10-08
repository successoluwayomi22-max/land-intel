"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  FileText,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CaseStudy {
  id: string;
  tag: string;
  title: string;
  investor: string;
  lossPrevented: string;
  riskType: string;
  summary: string;
  deception: string;
  detection: string;
  verdict: string;
  badgeColor: string;
}

interface CaseStudiesSectionProps {
  caseStudies: CaseStudy[];
}

export const CaseStudiesSection: React.FC<CaseStudiesSectionProps> = ({ caseStudies }) => {
  const [activeCaseTab, setActiveCaseTab] = useState(0);
  const cs = caseStudies[activeCaseTab];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tab Selector */}
      <div role="tablist" aria-label="Case Studies" className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
        {caseStudies.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={activeCaseTab === idx}
            aria-controls={item.id}
            onClick={() => setActiveCaseTab(idx)}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
              activeCaseTab === idx
                ? "bg-blue-700 text-white shadow-md ring-1 ring-blue-700"
                : "bg-white text-slate-700 hover:text-brand-darkNavy hover:bg-slate-50 border border-brand-border shadow-2xs"
            }`}
          >
            <span>{item.tag.split(":")[0]}</span>
            <span className={`hidden sm:inline ${activeCaseTab === idx ? "text-white font-bold" : "text-slate-600"}`}>— {item.lossPrevented}</span>
          </button>
        ))}
      </div>

      {/* Active Case Card */}
      {cs && (
        <div
          id={cs.id}
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`tab-${cs.id}`}
          className="bg-white border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-card space-y-4 sm:space-y-6 relative overflow-hidden"
        >
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 border-b border-brand-border pb-3 sm:pb-4">
            <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md border w-fit ${cs.badgeColor}`}>
              {cs.tag}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span>Capital Protected: {cs.lossPrevented}</span>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-lg xs:text-xl sm:text-2xl font-black font-heading text-brand-darkNavy tracking-tight leading-snug">
              {cs.title}
            </h3>
            <p className="text-[11px] sm:text-xs font-medium text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                <span>Investor Profile: {cs.investor}</span>
              </span>
              <span className="text-slate-400 hidden xs:inline" aria-hidden="true">|</span>
              <span className="text-amber-800 font-semibold">{cs.riskType}</span>
            </p>
          </div>

          {/* 3 Step Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1 sm:pt-2">
            <div className="bg-slate-50 border border-brand-border rounded-xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                <span>1. Transaction Context</span>
              </span>
              <p className="text-xs text-brand-textSecondary leading-relaxed">{cs.summary}</p>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>2. Hidden Risk Detected</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{cs.deception}</p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3. Cadastral Resolution</span>
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{cs.detection}</p>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="bg-slate-50 border border-brand-border rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-brand-darkNavy block">Audit Verdict</span>
                <span className="text-xs text-slate-700 font-mono font-medium leading-tight block">{cs.verdict}</span>
              </div>
            </div>
            <Link href="/register" prefetch={false} className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full sm:w-auto text-xs py-2.5 sm:py-2 px-4 shadow-sm font-bold flex items-center justify-center">
                <span>Screen Your Property Now</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
