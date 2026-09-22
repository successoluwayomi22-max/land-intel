"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  PlusCircle,
  MapPin,
  FileCheck,
  AlertTriangle,
  Sparkles,
  Lock,
  Activity,
  Layers,
  FileText,
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
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800 bg-[#060A14] text-slate-100 selection:bg-brand-blue/30 selection:text-blue-200">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Main Text Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>AI Cadastral Due-Diligence & Title Intelligence</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-mono text-[11px]">Universal Cadastral Grid</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-heading tracking-tight leading-[1.08]">
            Never Purchase Land on Blind Faith.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Verify Coordinates & Title First.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
            Over 68% of remote land disputes stem from beacon coordinate mismatches, rival family deeds, and unconsented state acquisitions. LandIntel mathematically cross-checks survey plans against cadastral charting registries, uncovering title defects before you wire funds.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {isLoggedIn ? (
              <>
                <Link href="/properties/new" prefetch={true}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-500/25 py-3.5 px-6 font-bold text-sm">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    <span>{t("newCase") || "New Property Investigation"}</span>
                  </Button>
                </Link>
                <Link href="/dashboard" prefetch={true}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-slate-900/60 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 py-3.5 px-6 font-bold text-sm">
                    <LayoutDashboard className="w-4 h-4 mr-2 text-blue-400" />
                    <span>{t("dashboard") || "Access Command Deck"}</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" prefetch={true}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-500/25 py-3.5 px-7 font-bold text-sm flex items-center justify-center gap-2">
                    <span>{t("analyzeProperty") || "Start Free Due-Diligence Scan"}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/how-it-works" prefetch={true}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 py-3.5 px-6 font-bold text-sm">
                    <span>{t("howItWorks") || "Explore Cadastral Engine"}</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free Initial Cadastral Scan</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AES-256 Document Encryption</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Certified 15-Section Due-Diligence PDF</span>
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* INTERACTIVE CADASTRAL DUE-DILIGENCE COCKPIT MOCKUP           */}
        {/* ============================================================ */}
        <div className="max-w-5xl mx-auto pt-4">
          <div className="bg-[#0B101E] border border-slate-800/90 rounded-2xl shadow-2xl shadow-blue-950/40 overflow-hidden backdrop-blur-xl">
            {/* Mock Window Top Bar */}
            <div className="bg-[#080D18] px-4 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 font-mono text-[11px] text-slate-300 hidden sm:inline">
                  landintel-omega.vercel.app/analysis/CAS-2026-METRO-0941
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold">RADAR ACTIVE</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">CADASTRAL SECTOR 03</span>
              </div>
            </div>

            {/* Mock Cockpit Content */}
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Cadastral Coordinate Map Simulation (7 Cols) */}
              <div className="lg:col-span-7 bg-[#050811] border border-slate-800/70 rounded-xl p-5 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Cadastral Coordinate Plotting (GPS / WGS-84)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    648.20 SQM
                  </span>
                </div>

                {/* Simulated Grid / Beacon Polygon */}
                <div className="h-44 sm:h-52 bg-slate-950/80 rounded-lg border border-slate-800/60 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />
                  
                  {/* Cadastral Polygon Line Simulation */}
                  <div className="absolute w-36 h-36 border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 rounded-lg transform rotate-6 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <span className="font-mono text-[10px] text-emerald-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      PARCEL 42 • CERTIFIED
                    </span>
                    {/* Beacons */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-md flex items-center justify-center text-[7px] font-mono text-slate-950 font-black">
                      1
                    </div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-md flex items-center justify-center text-[7px] font-mono text-slate-950 font-black">
                      2
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-md flex items-center justify-center text-[7px] font-mono text-slate-950 font-black">
                      3
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-md flex items-center justify-center text-[7px] font-mono text-slate-950 font-black">
                      4
                    </div>
                  </div>

                  {/* Buffer warning line (Committed Acquisition Buffer) */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Buffer: 48m outside Arterial Road reserve
                    </span>
                    <span className="text-slate-400 font-mono">No Encroachment</span>
                  </div>
                </div>

                {/* Beacon Coordinates Table Snippet */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 flex justify-between">
                    <span className="text-slate-300">BC-CAD/1042A</span>
                    <span className="text-emerald-400">E: 542918.42</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60 flex justify-between">
                    <span className="text-slate-300">BC-CAD/1042B</span>
                    <span className="text-emerald-400">N: 712049.18</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Automated Document & Risk Assessment (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                {/* Risk Score Meter Card */}
                <div className="bg-[#050811] border border-slate-800/70 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Composite Risk Score</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                      VERIFIED LOW RISK
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-400 font-heading">14</span>
                    <span className="text-xs text-slate-500 font-mono">/ 100 Risk Index</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full w-[14%]" />
                  </div>
                </div>

                {/* Cross-Document Consistency Matrix */}
                <div className="bg-[#050811] border border-slate-800/70 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
                    Cross-Document Heuristics
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Survey vs Deed Plot ID</span>
                    </span>
                    <span className="font-mono text-emerald-400 text-[11px]">Exact Match</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assignor Root of Title</span>
                    </span>
                    <span className="font-mono text-emerald-400 text-[11px]">Unbroken Lineage</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Gazetted Excision Notice</span>
                    </span>
                    <span className="font-mono text-emerald-400 text-[11px]">Vol. 42 Pg. 81</span>
                  </div>
                </div>

                {/* Fast Action */}
                <Link href="/register" className="block">
                  <div className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs rounded-lg text-center shadow-md transition-all cursor-pointer">
                    Inspect Your Property Case &rarr;
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Global Diaspora Proof Bar */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-heading">₦4.8B+</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Land Value Vetted</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-heading">1,420+</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Survey Plans Charted</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-heading">0</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Undetected Beacon Clashes</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-heading">Universal</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Multi-Jurisdiction Registries</div>
          </div>
        </div>
      </div>
    </section>
  );
};
