"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowRight, CheckCircle2, LayoutDashboard, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/providers/LocaleProvider";

export const HeroSection: React.FC = () => {
  const { t } = useLocale();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("landintel_user") : null;
    if (savedUser) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-brand-border bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-darkNavy font-heading tracking-tight leading-[1.1]">
            {t("heroTitle")}
          </h1>

          <p className="text-base sm:text-lg text-brand-textSecondary leading-relaxed max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isLoggedIn ? (
              <>
                <Link href="/properties/new" prefetch={true}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    <span>{t("newCase") || "New Property Case"}</span>
                  </Button>
                </Link>
                <Link href="/dashboard" prefetch={true}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <LayoutDashboard className="w-4 h-4 mr-2 text-brand-blue" />
                    <span>{t("dashboard") || "Go to Dashboard"}</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" prefetch={true}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    <span>{t("analyzeProperty") || "Analyze a Property"}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/how-it-works" prefetch={true}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <span>{t("howItWorks") || "See How It Works"}</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-brand-textMuted">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
              <span>{t("freeScreening") || "Generous Free Analysis Tier"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
              <span>{t("security") || "Encrypted Private Storage"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-success" />
              <span>{t("reportPriceTitle") || "Genuine Server-Generated PDF"}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
