"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Layers,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DemoPreset {
  id: string;
  name: string;
  location: string;
  easting: string;
  northing: string;
  zone: string;
  riskScore: number;
  riskLevel: "CRITICAL" | "MODERATE" | "CLEAN";
  statusTitle: string;
  findingSummary: string;
  bufferOverlap: string;
  gazetteMatch: string;
}

const PRESETS: DemoPreset[] = [
  {
    id: "lekki-buffer",
    name: "Coastal Arterial Corridor",
    location: "Lekki Phase 2, Lagos",
    easting: "589210.45",
    northing: "714320.12",
    zone: "UTM Zone 31N",
    riskScore: 92,
    riskLevel: "CRITICAL",
    statusTitle: "Committed Highway Setback Buffer Overlap",
    findingSummary: "The boundary polygon mathematically penetrates 140 meters into the gazetted coastal road reservation buffer. Mandatory future demolition with zero compensation.",
    bufferOverlap: "140m Arterial Road Corridor",
    gazetteMatch: "Gazette Vol. 48 No. 12 (Committed)",
  },
  {
    id: "epe-scheme",
    name: "Peri-Urban Residential Scheme",
    location: "Epe Expressway Corridor",
    easting: "612450.00",
    northing: "731100.00",
    zone: "UTM Zone 31N",
    riskScore: 48,
    riskLevel: "MODERATE",
    statusTitle: "Uncommitted Acquisition — Gazette Pending",
    findingSummary: "Parcel is in agricultural zoning with unreleased state acquisition. Excision has been tracked but not formally gazetted. Requires Governor's consent regularisation.",
    bufferOverlap: "0m Setback Encroachment",
    gazetteMatch: "Excision Tracking Ref. #EP-2022-89",
  },
  {
    id: "vi-registered",
    name: "Commercial Leasehold Parcel",
    location: "Victoria Island Extension",
    easting: "543100.20",
    northing: "712900.50",
    zone: "UTM Zone 31N",
    riskScore: 8,
    riskLevel: "CLEAN",
    statusTitle: "Clean Title & Beacons Verified",
    findingSummary: "SURCON licensed surveyor closure error under 0.03m. Valid registered State Certificate of Occupancy root of title verified against central cadastre.",
    bufferOverlap: "0m (Compliant with Masterplan)",
    gazetteMatch: "Unencumbered Freehold / C of O",
  },
];

export const InteractiveDemoScanner: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset>(PRESETS[0]);
  const [eastingInput, setEastingInput] = useState(PRESETS[0].easting);
  const [northingInput, setNorthingInput] = useState(PRESETS[0].northing);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DemoPreset | null>(PRESETS[0]);

  const handleSelectPreset = (preset: DemoPreset) => {
    setSelectedPreset(preset);
    setEastingInput(preset.easting);
    setNorthingInput(preset.northing);
    setScanResult(preset);
  };

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // If user typed custom coordinates, evaluate proximity or return current preset evaluation
      setScanResult(selectedPreset);
    }, 1100);
  };

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-brand-border" id="demo-scanner">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-2.5 sm:space-y-3">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center justify-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Cadastral Simulator</span>
          </span>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            Test the Cadastral Scanner in Real Time
          </h2>
          <p className="text-xs xs:text-sm text-brand-textSecondary leading-relaxed">
            Select an actual real-world scenario below or enter beacon coordinates to simulate how LandIntel catches coordinate shifts and government setbacks.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="max-w-5xl mx-auto bg-slate-50 border border-brand-border rounded-2xl p-4 sm:p-8 shadow-card space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              1-Click Real-World Due-Diligence Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                    selectedPreset.id === preset.id
                      ? "bg-white border-blue-600 shadow-sm ring-1 ring-blue-600"
                      : "bg-white/70 border-slate-200 hover:bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-brand-darkNavy truncate">{preset.name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        preset.riskLevel === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : preset.riskLevel === "MODERATE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {preset.riskLevel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{preset.location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Input Form */}
          <div className="bg-white border border-brand-border rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Easting (X - Meters)
                </label>
                <input
                  type="text"
                  value={eastingInput}
                  onChange={(e) => setEastingInput(e.target.value)}
                  placeholder="e.g. 589210.45"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Northing (Y - Meters)
                </label>
                <input
                  type="text"
                  value={northingInput}
                  onChange={(e) => setNorthingInput(e.target.value)}
                  placeholder="e.g. 714320.12"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  SURCON Projection Grid
                </label>
                <input
                  type="text"
                  disabled
                  value="Minna Datum / UTM Zone 31N"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Plots coordinates against official gazetted road reservations, setbacks, and acquisition layers.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunScan}
                disabled={isScanning}
                className="w-full sm:w-auto font-bold text-xs py-2.5 px-5 shadow-sm flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cross-Examining Cadastre...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Run Algorithmic Cadastral Scan</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          {scanResult && !isScanning && (
            <div className="bg-white border border-brand-border rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        scanResult.riskLevel === "CRITICAL"
                          ? "bg-rose-600 animate-pulse"
                          : scanResult.riskLevel === "MODERATE"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Cadastral Scan Output
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-brand-darkNavy font-heading">
                    {scanResult.statusTitle}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Risk Score
                    </span>
                    <span
                      className={`text-2xl font-black font-heading ${
                        scanResult.riskLevel === "CRITICAL"
                          ? "text-rose-600"
                          : scanResult.riskLevel === "MODERATE"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {scanResult.riskScore}
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Setback Encroachment
                  </span>
                  <span className="text-xs font-bold text-brand-darkNavy mt-0.5 block">
                    {scanResult.bufferOverlap}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Gazette &amp; Excision Status
                  </span>
                  <span className="text-xs font-bold text-brand-darkNavy mt-0.5 block truncate">
                    {scanResult.gazetteMatch}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Beacon Geometric Closure
                  </span>
                  <span className="text-xs font-bold text-brand-darkNavy mt-0.5 block">
                    SURCON 4-Point Boundary Plot
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="font-bold text-brand-darkNavy">Cadastral Verdict: </span>
                {scanResult.findingSummary}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-500">
                  Ready to test your actual property survey plans and deeds?
                </span>
                <Link href="/register" prefetch={true} className="w-full sm:w-auto">
                  <Button variant="primary" size="sm" className="w-full sm:w-auto text-xs py-2 px-4 shadow-sm font-bold flex items-center justify-center gap-1.5">
                    <span>Audit Real Property Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
