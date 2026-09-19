"use client";

import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ShieldCheck, Compass } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
            {t("aboutLandIntel") || "About LandIntel"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            {t("aboutTitle") || "Diaspora Land Solutions — Securing Nigerian Land for the Global Nigerian"}
          </h1>
          <p className="text-base text-brand-textSecondary leading-relaxed">
            {t("aboutSubtitle") ||
              "LandIntel was founded to address the systematic information asymmetry faced by Nigerians living abroad, remote investors, and families purchasing real estate across Nigeria."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          <div className="bg-white p-6 rounded-card border border-brand-border shadow-subtle space-y-2">
            <Compass className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-brand-textPrimary font-heading">
              {t("evidenceFirstTitle") || "Evidence-First Methodology"}
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              {t("evidenceFirstDesc") ||
                "We do not provide vague impressions. We parse actual cadastral beacon numbers, verify assignor covenants in Deeds of Assignment, and flag discrepancies across documents."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-brand-border shadow-subtle space-y-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h3 className="text-base font-bold text-brand-textPrimary font-heading">
              {t("objectiveRiskTitle") || "Objective Risk Indicators"}
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              {t("objectiveRiskDesc") ||
                "We do not broker real-estate or sell land. Our incentive is 100% aligned with the buyer: transparent risk exposure before capital is committed."}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-card p-6 text-xs text-brand-textSecondary space-y-3 leading-relaxed">
          <h4 className="text-sm font-bold text-brand-textPrimary font-heading">
            {t("ethicalStanceTitle") || "Our Ethical Stance"}
          </h4>
          <p>
            {t("ethicalStanceDesc") ||
              "LandIntel operates under clear boundaries: we do not certify legal title, guarantee government approval, or replace registered surveyors or property attorneys. Instead, we empower buyers with structured evidence and specific questions to take to their independent legal and surveying counsel."}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
