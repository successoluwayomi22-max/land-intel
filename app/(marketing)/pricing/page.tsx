"use client";

import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PricingCards } from "@/components/marketing/PricingCards";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function PricingPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
            {t("viewPricingIn") || "Multi-Currency Pricing & Certification"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            {t("pricingTitle") || "Know The Land Risk Before Committing Millions"}
          </h1>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            {t("pricingSubtitle") ||
              "No recurring monthly subscriptions. Use preliminary screening for free, or unlock comprehensive certified 15-section due-diligence reports via Paystack in your local currency."}
          </p>
        </div>

        <PricingCards />
      </main>

      <Footer />
    </div>
  );
}
