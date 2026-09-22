"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Lock, ArrowRight, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";
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
        <span className="text-xs font-semibold text-slate-400 mr-2">
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
                  ? "bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-400"
                  : "bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white"
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
        <div className="bg-[#0B101E] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t("preliminaryEvaluation") || "Preliminary Evaluation"}
              </span>
              <h3 className="text-3xl font-extrabold font-heading text-white mt-1">
                {formatPrice(0)}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {t("freeScreening") || "Explore preliminary risk indicators and document classifications"}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1 Active Property Case</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Upload up to 2 Documents (Survey & Title preview)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated Document Classification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Overall Risk Score (0–100)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t("verifiedTitle") || "11-Point Verification Checklist"}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Page-level discrepancy evidence locked</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Official PDF report export locked</span>
              </li>
            </ul>
          </div>

          <Link href={isLoggedIn ? "/dashboard" : "/register"} prefetch={true} className="w-full block">
            <Button variant="outline" size="md" className="w-full bg-slate-900/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold py-2.5">
              {isLoggedIn ? (t("dashboard") || "Go to Dashboard") : (t("getStartedFree") || "Get Started Free")}
            </Button>
          </Link>
        </div>

        {/* Tier 2: Single Property Cadastral Audit */}
        <div className="bg-[#0D1829] border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl space-y-6 flex flex-col justify-between relative transform hover:-translate-y-1 transition-all">
          <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full tracking-wider uppercase shadow-md">
            {t("mostPopular") || "Most Popular"}
          </span>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  {t("singleReport") || "Cadastral Due-Diligence Audit"}
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                  7.5% VAT Included
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <h3 className="text-3xl font-extrabold font-heading text-white">
                  {formatPrice(48375)}
                </h3>
                <span className="text-xs text-slate-400 font-medium">{t("perProperty") || "/ property"}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Base: {formatPrice(45000)} &bull; 7.5% Statutory VAT: {formatPrice(3375)}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {t("reportPriceTitle") || "Instant 15-section risk audit & boundary cross-examination"}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>{t("everythingInFree") || "Everything in Free Tier"}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full 15-Section Certified Due-Diligence Report</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unredacted Cadastral Evidence & Beacon Matching</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t("downloadGenuinePdf") || "Official Cryptographic PDF Report Download"}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant Statutory Tax Receipt</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interactive Property Due-Diligence Assistant</span>
              </li>
            </ul>
          </div>

          <Link href={isLoggedIn ? "/properties/new" : "/register"} prefetch={true} className="w-full block">
            <Button variant="primary" size="md" className="w-full shadow-lg shadow-emerald-600/30 font-bold bg-emerald-600 hover:bg-emerald-500 text-white py-2.5">
              <span>{isLoggedIn ? `${t("auditProperty") || "Start Property Audit"} (${formatPrice(48375)})` : `${t("auditProperty") || "Audit Property"} (${formatPrice(48375)})`}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Tier 3: Professional Investor Plan (100% Automated SaaS Multi-Property Access) */}
        <div className="bg-[#0B1226] text-white border-2 border-blue-500/80 hover:border-blue-400 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between relative transform hover:-translate-y-1 transition-all">
          <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full tracking-wider uppercase shadow-md">
            {t("proInvestor") || "Investor Plan"}
          </span>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t("professionalPlan") || "Professional Investor"}</span>
                </span>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-950/90 border border-blue-500/40 px-2 py-0.5 rounded-md">
                  7.5% VAT Included
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <h3 className="text-3xl font-extrabold font-heading text-white tracking-tight">
                  {formatPrice(134375)}
                </h3>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Base: {formatPrice(125000)} &bull; 7.5% Statutory VAT: {formatPrice(9375)}
              </p>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Full-featured portfolio due-diligence for diaspora investors &amp; real-estate developers.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
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
            <Button variant="primary" size="md" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold border-0 shadow-lg shadow-blue-600/30 py-2.5">
              <span>{isLoggedIn ? "Upgrade to Professional" : "Subscribe Professional"} ({formatPrice(134375)})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secured instant checkout. Accepts Mastercard, Visa, Verve, Apple Pay &amp; International Bank Cards.</span>
        </p>
      </div>
    </div>
  );
};
