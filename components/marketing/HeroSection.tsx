import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { HeroCta } from "./HeroCta";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28 border-b border-brand-border bg-gradient-to-b from-white via-white to-slate-50 text-brand-textPrimary selection:bg-blue-100 selection:text-blue-900">
      {/* Ambient soft background accents */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-50/70 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f030_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f030_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10 space-y-8 sm:space-y-12">
        {/* Main Text Header */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">

          {/* Heading - Primary LCP Target */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black text-brand-darkNavy font-heading tracking-tight leading-[1.12] sm:leading-[1.08] px-1 sm:px-0">
            Verify Any Property Before You Wire Millions.
          </h1>

          {/* Subtitle */}
          <p className="text-xs xs:text-sm sm:text-lg text-brand-textSecondary leading-relaxed max-w-3xl mx-auto font-normal px-2 sm:px-0">
            Independent property due diligence, survey boundary verification, and title authentication for diaspora buyers, remote investors, and property developers.
          </p>

          {/* Action CTAs */}
          <HeroCta />

          {/* Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-6 text-xs text-slate-700 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Free Initial Cadastral Scan</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>AES-256 Document Encryption</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Certified 15-Section Due-Diligence PDF</span>
            </span>
          </div>
        </div>

        {/* Global Methodology Proof Bar */}
        <div className="pt-6 border-t border-brand-border grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center">
          <div className="p-2 sm:p-0">
            <div className="text-xl xs:text-2xl sm:text-3xl font-black text-brand-darkNavy font-heading tracking-tight">15-Point Check</div>
            <div className="text-xs text-slate-700 font-medium mt-1">Statutory Deed &amp; Cadastral Audit</div>
          </div>
          <div className="p-2 sm:p-0">
            <div className="text-xl xs:text-2xl sm:text-3xl font-black text-brand-darkNavy font-heading tracking-tight">UTM 31N/32N</div>
            <div className="text-xs text-slate-700 font-medium mt-1">SURCON Sub-Meter Coordinate Grid</div>
          </div>
          <div className="p-2 sm:p-0">
            <div className="text-xl xs:text-2xl sm:text-3xl font-black text-emerald-700 font-heading tracking-tight">Gazette Overlay</div>
            <div className="text-xs text-slate-700 font-medium mt-1">Committed Acquisition &amp; Setback Screening</div>
          </div>
          <div className="p-2 sm:p-0">
            <div className="text-xl xs:text-2xl sm:text-3xl font-black text-purple-700 font-heading tracking-tight">SHA-256</div>
            <div className="text-xs text-slate-700 font-medium mt-1">Tamper-Proof Audit QR Seal</div>
          </div>
        </div>
      </div>
    </section>
  );
};
