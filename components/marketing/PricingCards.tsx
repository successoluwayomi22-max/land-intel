"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Lock, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CountryFlag } from "@/components/ui/CountryFlags";
import { useLocale, CURRENCIES, SupportedCurrency } from "@/components/providers/LocaleProvider";

export const PricingCards: React.FC = () => {
  const { currency, setCurrency, formatPrice, t } = useLocale();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("landintel_user")) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Interactive Currency Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold text-slate-600 mr-2">
          {t("viewPricingIn")}
        </span>
        {(Object.keys(CURRENCIES) as SupportedCurrency[]).map((cKey) => {
          const c = CURRENCIES[cKey];
          const isSelected = currency === cKey;
          return (
            <button
              key={cKey}
              type="button"
              onClick={() => setCurrency(cKey)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-brand-blue text-white shadow-sm scale-105"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              <CountryFlag countryCode={c.countryCode} size={15} />
              <span>{c.code}</span>
              <span className="text-[11px] opacity-75 font-normal">({c.symbol})</span>
            </button>
          );
        })}
      </div>

      {/* 3 Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Tier 1: Free User */}
        <div className="bg-white border border-brand-border rounded-card p-6 shadow-card space-y-6 flex flex-col justify-between hover:border-brand-blue/40 transition-colors">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-brand-textMuted uppercase tracking-wider">
                {t("preliminaryEvaluation") || "Preliminary Evaluation"}
              </span>
              <h2 className="text-3xl font-extrabold font-heading text-brand-darkNavy mt-1">
                {formatPrice(0)}
              </h2>
              <p className="text-xs text-brand-textSecondary mt-1">
                {t("freeScreening") || "Explore preliminary risk indicators and document classifications"}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-brand-textSecondary border-t pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 Active Property Case</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Upload up to 2 Documents (Survey & Title preview)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automated Document Classification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Overall Risk Score (0–100)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t("verifiedTitle") || "11-Point Verification Checklist"}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Page-level discrepancy evidence locked</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Official PDF report export locked</span>
              </li>
            </ul>
          </div>

          <Link href={isLoggedIn ? "/dashboard" : "/register"} prefetch={true} className="w-full block">
            <Button variant="outline" size="md" className="w-full font-semibold">
              {isLoggedIn ? (t("dashboard") || "Go to Dashboard") : (t("getStartedFree") || "Get Started Free")}
            </Button>
          </Link>
        </div>

        {/* Tier 2: Single Property Cadastral Audit */}
        <div className="bg-white border-2 border-emerald-600 rounded-card p-6 shadow-card space-y-6 flex flex-col justify-between relative transform hover:-translate-y-1 transition-all">
          <span className="absolute -top-3 right-6 bg-emerald-700 text-white text-[10px] font-bold px-3 py-0.5 rounded-pill tracking-wider uppercase shadow-xs">
            {t("mostPopular") || "Most Popular"}
          </span>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  {t("singleReport") || "Cadastral Due-Diligence Audit"}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  7.5% VAT Included
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <h2 className="text-3xl font-extrabold font-heading text-brand-darkNavy">
                  {formatPrice(48375)}
                </h2>
                <span className="text-xs text-brand-textMuted font-medium">{t("perProperty") || "/ property"}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Base: {formatPrice(45000)} &bull; 7.5% Statutory VAT: {formatPrice(3375)}
              </p>
              <p className="text-xs text-brand-textSecondary mt-1">
                {t("reportPriceTitle") || "Instant 15-section risk audit & boundary cross-examination"}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-brand-textSecondary border-t pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>{t("everythingInFree") || "Everything in Free Tier"}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full 15-Section Certified Due-Diligence Report</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unredacted Cadastral Evidence & Beacon Matching</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t("downloadGenuinePdf") || "Official Cryptographic PDF Report Download"}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Statutory Tax Receipt</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Interactive Property Due-Diligence Assistant</span>
              </li>
            </ul>
          </div>

          <Link href={isLoggedIn ? "/properties/new" : "/register"} prefetch={true} className="w-full block">
            <Button variant="primary" size="md" className="w-full shadow-subtle font-bold bg-emerald-700 hover:bg-emerald-800">
              <span>{isLoggedIn ? `${t("auditProperty") || "Start Property Audit"} (${formatPrice(48375)})` : `${t("auditProperty") || "Audit Property"} (${formatPrice(48375)})`}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Tier 3: Professional Investor Plan (100% Automated SaaS Multi-Property Access) */}
        <div className="bg-slate-900 text-white border-2 border-brand-blue/60 hover:border-brand-blue rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between relative transform hover:-translate-y-1 transition-all">
          <span className="absolute -top-3 right-6 bg-brand-blue text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
            {t("proInvestor") || "Investor Plan"}
          </span>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
                  <span>{t("professionalPlan") || "Professional Investor"}</span>
                </span>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-950/90 border border-blue-500/40 px-2 py-0.5 rounded-md shadow-2xs">
                  7.5% VAT Included
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <h2 className="text-3xl font-extrabold font-heading text-white tracking-tight">
                  {formatPrice(134375)}
                </h2>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Base: {formatPrice(125000)} &bull; 7.5% Statutory VAT: {formatPrice(9375)}
              </p>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Full-featured portfolio due-diligence for diaspora investors &amp; real-estate developers.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800/90 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>15 Active Property Cases</strong> monthly</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited Documents per Case (Surveys, Deeds, C of O)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full 15-Section Certified PDF Report Exports</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Cross-Document Discrepancy Matrix</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited Due-Diligence Assistant Inquiries</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Priority High-Speed OCR Processing Queue</span>
              </li>
            </ul>
          </div>

          <Link href={isLoggedIn ? "/billing" : "/register"} prefetch={true} className="w-full block">
            <Button variant="primary" size="md" className="w-full bg-brand-blue hover:bg-brand-blueHover text-white font-bold border-0 shadow-md">
              <span>{isLoggedIn ? "Upgrade to Professional" : "Subscribe Professional"} ({formatPrice(134375)})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-brand-textSecondary flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured instant checkout. Accepts Mastercard, Visa, Verve, Apple Pay &amp; International Bank Cards.</span>
        </p>
      </div>
    </div>
  );
};
