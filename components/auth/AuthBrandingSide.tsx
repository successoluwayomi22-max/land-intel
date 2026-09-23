"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Scale,
  Compass,
  CheckCircle2,
} from "lucide-react";

interface AuthBrandingSideProps {
  quote?: {
    text: string;
    author: string;
    role: string;
  };
}

export const AuthBrandingSide: React.FC<AuthBrandingSideProps> = ({
  quote = {
    text: "When you are buying from abroad, you cannot rely on verbal assurances or WhatsApp videos. LandIntel plotted the survey coordinates against the official gazette and caught an unconsented 140-meter highway buffer. It saved our family £35,000.",
    author: "Dr. James & Folake Oduya",
    role: "Healthcare Director & Diaspora Buyers (London, UK)",
  },
}) => {
  return (
    <aside className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-[#0c1427] border-r border-slate-800 p-8 xl:p-12 flex-col justify-between relative overflow-hidden text-slate-100">
      {/* Subtle fine architectural grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Brand & Philosophy Header */}
      <div className="relative z-10 space-y-6">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center font-bold text-white shadow-md shadow-blue-950/40 text-lg">
            L
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white block">
              LandIntel
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              Cadastral Due Diligence &amp; Title Verification
            </span>
          </div>
        </Link>

        <div className="space-y-2.5 pt-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Independent Due Diligence
          </span>
          <h1 className="text-2xl xl:text-3xl font-bold font-heading text-white tracking-tight leading-tight">
            Verify the ground before you wire the funds.
          </h1>
          <p className="text-xs xl:text-sm text-slate-300 leading-relaxed max-w-md font-normal">
            Independent survey beacon plotting and statutory title registry verification for remote purchasers, diaspora buyers, and conveyancing counsel.
          </p>
        </div>

        {/* Authentic Cadastral Coordinate Audit Terminal */}
        <div className="bg-[#111c34] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-blue" />
              <span className="font-semibold text-slate-200">Cadastral Boundary Audit</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">REF: LK-2026-9810A</span>
          </div>

          {/* Coordinate Inspection Table */}
          <div className="space-y-2 text-xs">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Location: Lekki Peninsula Scheme II</span>
              <span className="font-mono text-slate-300">Minna / UTM 31N</span>
            </div>

            <div className="bg-[#0b1325] border border-slate-800/80 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-800/40 text-slate-400 border-b border-slate-800/60 text-[10px]">
                    <th className="py-1.5 px-3">Beacon</th>
                    <th className="py-1.5 px-3">Easting</th>
                    <th className="py-1.5 px-3">Northing</th>
                    <th className="py-1.5 px-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-200">PB 4810</td>
                    <td className="py-1.5 px-3 text-slate-400">542,108.24</td>
                    <td className="py-1.5 px-3 text-slate-400">712,490.15</td>
                    <td className="py-1.5 px-3 text-right text-emerald-400">Plotted</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-200">PB 4811</td>
                    <td className="py-1.5 px-3 text-slate-400">542,156.80</td>
                    <td className="py-1.5 px-3 text-slate-400">712,488.30</td>
                    <td className="py-1.5 px-3 text-right text-emerald-400">Plotted</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-200">PB 4812</td>
                    <td className="py-1.5 px-3 text-slate-400">542,154.10</td>
                    <td className="py-1.5 px-3 text-slate-400">712,420.90</td>
                    <td className="py-1.5 px-3 text-right text-emerald-400">Plotted</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-200">PB 4813</td>
                    <td className="py-1.5 px-3 text-slate-400">542,105.70</td>
                    <td className="py-1.5 px-3 text-slate-400">712,422.50</td>
                    <td className="py-1.5 px-3 text-right text-emerald-400">Plotted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Title Verification Summary */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Setback Encroachment:</span>
              <span className="font-medium text-emerald-400">0.00m (Clean Buffer)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Root of Title:</span>
              <span className="font-medium text-slate-200">Deed of Assignment with Governor&apos;s Consent</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Gazette Status:</span>
              <span className="font-medium text-emerald-400">Excision Gazetted (Vol. 19, No. 44)</span>
            </div>
          </div>

          {/* Clean Outcome Footer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <FileCheck2 className="w-3.5 h-3.5 text-brand-blue" />
              <span>Area: 1,050.40 m²</span>
            </div>
            <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Cleared for Conveyance
            </span>
          </div>
        </div>

        {/* Real Customer Testimony */}
        <div className="border-l-2 border-brand-blue pl-4 py-1 max-w-md">
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            &ldquo;{quote.text}&rdquo;
          </p>
          <div className="mt-2">
            <span className="text-xs text-white font-semibold block">
              {quote.author}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {quote.role}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Trust Markers */}
      <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Private AES-256 Storage</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-slate-400" />
          <span>100% Independent from Vendors</span>
        </span>
      </div>
    </aside>
  );
};
