"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";
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
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-brand-border bg-gradient-to-b from-white via-white to-slate-50 text-brand-textPrimary selection:bg-blue-100 selection:text-blue-900">
      {/* Ambient soft background accents */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-50/70 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f030_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f030_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Main Text Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-darkNavy font-heading tracking-tight leading-[1.08]">
            {t("heroTitle") || "Verify Any Property Before You Wire Millions."}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-brand-textSecondary leading-relaxed max-w-3xl mx-auto font-normal">
            {t("heroSubtitle") || "Institutional property due-diligence, cadastral boundary verification, and title intelligence — engineered for diaspora buyers, remote investors, and global institutions."}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {isLoggedIn ? (
              <>
                <Link href="/properties/new" prefetch={true}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md py-3.5 px-6 font-bold text-sm">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    <span>{t("newCase") || "New Property Investigation"}</span>
                  </Button>
                </Link>
                <Link href="/dashboard" prefetch={true}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white border-slate-300 text-brand-darkNavy hover:bg-slate-50 py-3.5 px-6 font-bold text-sm shadow-xs">
                    <LayoutDashboard className="w-4 h-4 mr-2 text-brand-blue" />
                    <span>{t("dashboard") || "Access Command Deck"}</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" prefetch={true}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md py-3.5 px-7 font-bold text-sm flex items-center justify-center gap-2">
                    <span>{t("analyzeProperty") || "Start Free Due-Diligence Scan"}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/how-it-works" prefetch={true}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white border-slate-300 text-slate-700 hover:text-brand-darkNavy hover:bg-slate-50 py-3.5 px-6 font-bold text-sm shadow-xs">
                    <span>{t("howItWorks") || "Explore Cadastral Engine"}</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-brand-textSecondary">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("freeScreening") || "Free Initial Cadastral Scan"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t("privateStorageTitle") || "AES-256 Document Encryption"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("downloadGenuinePdf") || "Certified 15-Section Due-Diligence PDF"}</span>
            </span>
          </div>
        </div>

        {/* Global Proof Bar */}
        <div className="pt-6 border-t border-brand-border grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-brand-darkNavy font-heading">$3.2M+</div>
            <div className="text-xs text-brand-textSecondary font-medium mt-1">Land Value Vetted</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-brand-darkNavy font-heading">1,420+</div>
            <div className="text-xs text-brand-textSecondary font-medium mt-1">Survey Plans Charted</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-heading">0</div>
            <div className="text-xs text-brand-textSecondary font-medium mt-1">Undetected Beacon Clashes</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-brand-darkNavy font-heading">Universal</div>
            <div className="text-xs text-brand-textSecondary font-medium mt-1">Multi-Jurisdiction Registries</div>
          </div>
        </div>
      </div>
    </section>
  );
};
