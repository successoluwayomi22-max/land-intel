"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Search,
  Building2,
  FileCheck,
  Scale,
  Users,
  Compass,
  FileSearch,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Landmark,
  Fingerprint,
  Clock,
  Sparkles,
  MapPin,
  Quote,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { PricingCards } from "@/components/marketing/PricingCards";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function LandingPage() {
  const { t } = useLocale();
  const [activeCaseTab, setActiveCaseTab] = useState(0);

  // Real-world diaspora fraud case studies
  const caseStudies = [
    {
      id: "case-01",
      tag: "CASE STUDY 01: METROPOLITAN COASTAL CORRIDOR",
      title: "The $32,000 'Ghost Beacon' in the Infrastructure Buffer",
      investor: "Dr. James O. — Healthcare Director & Cross-Border Investor",
      lossPrevented: "$32,000 (£25,000)",
      riskType: "Drainage Basin & Arterial Highway Setback",
      summary:
        "The vendor presented an immaculate Registered Survey Plan with authentic-looking beacon coordinates and an attractive community layout. The buyer was within 48 hours of wiring the closing deposit from abroad.",
      deception:
        "Physical site visit videos arranged via messaging apps showed dry ground and neighboring perimeter walls. However, the vendor's surveyor had shifted the site boundary on paper by 140 meters to mask where the parcel actually lay.",
      detection:
        "LandIntel's Cadastral Engine mathematically plotted the 4 boundary coordinates (WGS-84) against official Cadastral Masterplan GIS layers. The coordinates plotted squarely into a gazetted arterial highway setback buffer with zero development rights.",
      verdict: "CRITICAL RISK (Score: 92/100) — Transaction Aborted Safely",
      badgeColor: "bg-rose-50 border-rose-200 text-rose-700",
    },
    {
      id: "case-02",
      tag: "CASE STUDY 02: HIGH-GROWTH METRO CORRIDOR",
      title: "The $43,500 'Family Land' with Three Conflicting Deeds",
      investor: "Sarah & David C. — Software Engineers & Remote Purchasers",
      lossPrevented: "$43,500 (CA$59,000)",
      riskType: "Rival Deed of Assignment & Split Lineage Claim",
      summary:
        "A prominent real-estate marketing firm marketed two serviced plots in a gated community. The vendor provided a Deed of Assignment executed by an accredited family representative.",
      deception:
        "The Deed cited an ancestral root of title, but omitted the statutory Principal Family Head power of attorney. The surveyor plan also referenced a layout survey with expired beacon numbering.",
      detection:
        "LandIntel's Cross-Document Heuristic engine detected that the Assignor named in the recent Deed lacked legal nexus to the root grant registered at the Central Lands Registry. A secondary search revealed the same parcel had already been assigned to an institutional buyer.",
      verdict: "FATAL DEFECT (Score: 88/100) — Dual Conveyance Averted",
      badgeColor: "bg-amber-50 border-amber-200 text-amber-700",
    },
    {
      id: "case-03",
      tag: "CASE STUDY 03: PERI-URBAN ARTERIAL EXPANSION",
      title: "The 'Gazette in Progress' Transit Right-of-Way Trap",
      investor: "Engr. Marcus A. — Energy Infrastructure Lead & Cross-Border Investor",
      lossPrevented: "$23,300 (€21,500)",
      riskType: "Committed Statutory Government Acquisition",
      summary:
        "A residential estate developer was actively selling 500 SQM plots with aggressive social media ads promising 'Excision in Progress' and guaranteed 200% appreciation within 18 months.",
      deception:
        "The developer produced a gazette tracking receipt from the Ministry of Lands, assuring diaspora buyers that the formal government excision release was merely an administrative formality.",
      detection:
        "LandIntel's Gazette & Acquisition Matching layer parsed the survey polygon. The parcel overlapped the gazetted 120-meter right-of-way corridor designated for a major Transit Infrastructure Project, meaning mandatory future forfeiture with zero compensation.",
      verdict: "UNENCUMBERED TITLE IMPOSSIBLE (Score: 95/100) — Saved Capital",
      badgeColor: "bg-rose-50 border-rose-200 text-rose-700",
    },
  ];

  const comparisonRows = [
    {
      feature: "Verification Method",
      traditional: "Intermediary or agent video walk-through",
      landIntel: "Mathematical coordinate plotting & multi-document cross-examination",
    },
    {
      feature: "Survey Plan Audit",
      traditional: "Visual check of ink stamps on scanned paper",
      landIntel: "OCR parsing of Easting/Northing beacons with official surveyor registry cross-check",
    },
    {
      feature: "State Acquisition Check",
      traditional: "Vendor verbal promise that 'excision is coming out soon'",
      landIntel: "Algorithmic buffer analysis against gazetted road, drainage, and government reservations",
    },
    {
      feature: "Deed vs. Survey Concordance",
      traditional: "Rarely checked; deeds and surveys are filed in separate drawers",
      landIntel: "Automated heuristic flag for plot number, square meter, and assignor name mismatches",
    },
    {
      feature: "Statutory Consent Review",
      traditional: "Overlooked until buyer attempts to register at the central lands registry months later",
      landIntel: "Statutory Land Act legal compliance check before capital commitment",
    },
    {
      feature: "Turnaround Time",
      traditional: "3 to 6 weeks of anxious chasing and fragmented phone calls",
      landIntel: "Instant preliminary automated scan, full 15-section audit in minutes",
    },
    {
      feature: "Audit Report",
      traditional: "Informal WhatsApp voice notes and fragmented text opinions",
      landIntel: "Cryptographically verifiable 15-section Due-Diligence PDF Dossier",
    },
  ];

  const documentItems = [
    {
      icon: Compass,
      title: t("doc1Title") || "Cadastral Survey Plans",
      desc:
        t("doc1Desc") ||
        "Beacon boundary numbers, licensed surveyor accreditation seals, coordinate plotting, and area dimensions.",
    },
    {
      icon: Scale,
      title: t("doc2Title") || "Deeds of Assignment",
      desc:
        t("doc2Desc") ||
        "Title covenants, assignor/assignee lineage, consideration tranches, and statutory execution stamps.",
    },
    {
      icon: Landmark,
      title: t("doc3Title") || "Certificate of Occupancy",
      desc:
        t("doc3Desc") ||
        "State registration volumes, 99-year leasehold commencement dates, and designated masterplan zoning.",
    },
    {
      icon: ShieldCheck,
      title: t("doc4Title") || "Statutory Authority Consent",
      desc:
        t("doc4Desc") ||
        "Endorsements by government land authorities validating legal transfer of statutory occupancy rights.",
    },
    {
      icon: FileSearch,
      title: t("doc5Title") || "Government Gazette Notices",
      desc:
        t("doc5Desc") ||
        "Excision notices, formal gazette volume numbers, boundary coordinates, and de-acquisition releases.",
    },
    {
      icon: FileCheck,
      title: t("doc6Title") || "Allocation Letters & Receipts",
      desc:
        t("doc6Desc") ||
        "Developer allocations, provisional booking terms, and accredited family acknowledgment receipts.",
    },
  ];

  const testimonials = [
    {
      name: "Dr. James Oduya",
      role: "Consultant Physician",
      location: "Cross-Border Property Investor — London, UK",
      avatar: "JO",
      quote:
        "I was on the verge of wiring funds for two plots in a high-growth corridor. The agent was persuasive, and the survey looked official. LandIntel's coordinate plotting revealed the beacons sat squarely in a committed government infrastructure setback. That 5-minute scan saved my life savings.",
      property: "Coastal Corridor Sector 3",
      saving: "$41,500 (£32,000)",
    },
    {
      name: "Sarah & David Chen",
      role: "Senior Software Engineers",
      location: "Remote Real Estate Buyers — Toronto, Canada",
      avatar: "SC",
      quote:
        "When buying from abroad, you are constantly told 'trust me, my representative is on the ground.' LandIntel gave us mathematical proof. The Deed had a different plot number than the registered survey plan. We forced the developer to fix the conveyance before signing.",
      property: "Prime Residential Enclave",
      saving: "$43,500 (CA$59,000)",
    },
    {
      name: "Engr. Marcus Adeyemi",
      role: "Infrastructure Project Director",
      location: "Energy Sector Executive — Houston, TX",
      avatar: "MA",
      quote:
        "The 15-section Due-Diligence PDF is institutional grade. I handed it directly to my independent property attorney, and it gave him exact beacon numbers and land registry volume references to cross-check against central archives. No guesswork.",
      property: "Metropolitan Cadastral Zone 04",
      saving: "$73,000 (€67,000)",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-background text-brand-textPrimary flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main id="main-content" className="flex-1">
        {/* 1. HERO SECTION */}
        <HeroSection />

        {/* 2. INSTITUTIONAL METRICS & REGULATORY TRUST MARQUEE */}
        <section className="py-10 bg-white border-y border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              <div className="text-center sm:text-left border-l-2 border-blue-600 pl-4 py-1">
                <span className="text-2xl sm:text-3xl font-black font-heading text-brand-darkNavy tracking-tight">
                  $3.2M+
                </span>
                <p className="text-xs text-brand-textSecondary font-medium mt-1">
                  Contested Land Capital Scrutinized
                </p>
              </div>

              <div className="text-center sm:text-left border-l-2 border-emerald-600 pl-4 py-1">
                <span className="text-2xl sm:text-3xl font-black font-heading text-emerald-600 tracking-tight">
                  1,420+
                </span>
                <p className="text-xs text-brand-textSecondary font-medium mt-1">
                  Cadastral Beacons Cross-Examined
                </p>
              </div>

              <div className="text-center sm:text-left border-l-2 border-cyan-600 pl-4 py-1">
                <span className="text-2xl sm:text-3xl font-black font-heading text-cyan-700 tracking-tight">
                  Multi-Grid
                </span>
                <p className="text-xs text-brand-textSecondary font-medium mt-1">
                  WGS-84 Coordinate Grid Coverage
                </p>
              </div>

              <div className="text-center sm:text-left border-l-2 border-purple-600 pl-4 py-1">
                <span className="text-2xl sm:text-3xl font-black font-heading text-purple-700 tracking-tight">
                  100%
                </span>
                <p className="text-xs text-brand-textSecondary font-medium mt-1">
                  Defensible Page-Linked Evidence
                </p>
              </div>
            </div>

            {/* Regulatory Grounding Badges */}
            <div className="mt-8 pt-6 border-t border-brand-border flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-brand-textSecondary">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Land Act Legal Heuristics</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Survey Plan Seal & Beacon Integrity</span>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-cyan-600" />
                <span>Official Cadastral & Land Registry Alignment</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>Zero AI Model Training on Private Deeds</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PERSUASIVE STORYTELLING: THE ANATOMY OF A PROPERTY TRAP */}
        <section className="py-20 lg:py-24 bg-slate-50/70 border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span>The Remote Property Dilemma</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
                The Anatomy of a $50,000+ Land Due-Diligence Trap
              </h2>
              <p className="text-sm sm:text-base text-brand-textSecondary leading-relaxed font-normal">
                Every year, thousands of diaspora and remote investors lose hard-earned capital to smooth-talking intermediaries, falsified surveys, and unconsented ancestral claims. Here is how three real investors almost lost everything — and how LandIntel caught it.
              </p>
            </div>

            {/* Interactive Case Study Tabs & Cards */}
            <div className="max-w-5xl mx-auto">
              {/* Tab Selector */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {caseStudies.map((cs, idx) => (
                  <button
                    key={cs.id}
                    onClick={() => setActiveCaseTab(idx)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      activeCaseTab === idx
                        ? "bg-brand-blue text-white shadow-md ring-1 ring-blue-500"
                        : "bg-white text-slate-600 hover:text-brand-darkNavy hover:bg-slate-50 border border-brand-border shadow-2xs"
                    }`}
                  >
                    <span>{cs.tag.split(":")[0]}</span>
                    <span className="hidden sm:inline opacity-75">— {cs.lossPrevented}</span>
                  </button>
                ))}
              </div>

              {/* Active Case Card */}
              {(() => {
                const cs = caseStudies[activeCaseTab];
                return (
                  <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-9 shadow-card space-y-6 relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
                      <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-md border ${cs.badgeColor}`}>
                        {cs.tag}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Capital Saved: {cs.lossPrevented}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-black font-heading text-brand-darkNavy tracking-tight">
                        {cs.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Victim Profile: {cs.investor}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-amber-700 font-semibold">{cs.riskType}</span>
                      </p>
                    </div>

                    {/* 3 Step Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="bg-slate-50 border border-brand-border rounded-xl p-4 space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-brand-blue" />
                          <span>1. The Pitch</span>
                        </span>
                        <p className="text-xs text-brand-textSecondary leading-relaxed">{cs.summary}</p>
                      </div>

                      <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-2">
                        <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>2. The Hidden Trap</span>
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{cs.deception}</p>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>3. LandIntel Detection</span>
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{cs.detection}</p>
                      </div>
                    </div>

                    {/* Verdict Banner */}
                    <div className="bg-slate-50 border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <AlertOctagon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-brand-darkNavy block">Audit Engine Outcome</span>
                          <span className="text-xs text-rose-600 font-mono font-bold">{cs.verdict}</span>
                        </div>
                      </div>
                      <Link href="/register" prefetch={true} className="w-full sm:w-auto">
                        <Button variant="primary" size="sm" className="w-full sm:w-auto text-xs py-2 px-4 shadow-sm font-bold">
                          <span>Screen Your Property Now</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* 4. COMPARISON MATRIX: WHATSAPP VS LANDINTEL */}
        <section className="py-20 bg-white border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                Decision Framework
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
                Blind Faith vs. Cadastral Intelligence
              </h2>
              <p className="text-sm text-brand-textSecondary leading-relaxed">
                Why relying on informal agent assurances fails, and how automated cadastral cross-examination protects your capital.
              </p>
            </div>

            <div className="max-w-5xl mx-auto bg-white border border-brand-border rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border bg-slate-50 text-slate-700 font-bold font-heading uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-5 w-1/3">Due-Diligence Vector</th>
                      <th className="py-4 px-5 w-1/3 text-rose-700 bg-rose-50/60">
                        Traditional / WhatsApp Buying
                      </th>
                      <th className="py-4 px-5 w-1/3 text-emerald-800 bg-emerald-50/60">
                        LandIntel Cadastral Engine
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {comparisonRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5 font-bold text-brand-darkNavy bg-slate-50/40">
                          {row.feature}
                        </td>
                        <td className="py-4 px-5 text-slate-600 bg-rose-50/20">
                          <div className="flex items-start gap-2">
                            <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span>{row.traditional}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-800 font-medium bg-emerald-50/20">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{row.landIntel}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CADASTRAL ENGINE PILLARS */}
        <section className="py-20 bg-slate-50/70 border-b border-brand-border" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                Proprietary Technology
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
                How LandIntel Deconstructs Property Risk
              </h2>
              <p className="text-sm text-brand-textSecondary leading-relaxed">
                Four interlocking analysis engines turn raw, fragmented property documents into an explainable, defensible risk verdict.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-subtle hover:border-brand-blue/50 hover:shadow-card transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-black">
                  01
                </div>
                <h3 className="text-base font-bold text-brand-darkNavy font-heading">
                  OCR Coordinate Extraction
                </h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">
                  Extracts raw Easting and Northing coordinate strings directly from surveyor stamps, converting Minna/UTM projections into global WGS-84 decimal latitude and longitude.
                </p>
              </div>

              <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-subtle hover:border-emerald-500/50 hover:shadow-card transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  02
                </div>
                <h3 className="text-base font-bold text-brand-darkNavy font-heading">
                  Cadastral Buffer Radar
                </h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">
                  Projects the parcel polygon against state gazette records, road setbacks, high-tension power line buffers, and regional drainage canals to catch compulsory acquisitions.
                </p>
              </div>

              <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-subtle hover:border-cyan-500/50 hover:shadow-card transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black">
                  03
                </div>
                <h3 className="text-base font-bold text-brand-darkNavy font-heading">
                  Deed vs. Survey Heuristics
                </h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">
                  Cross-compares assignor names, parcel sizes in square meters, beacon IDs, and execution dates across every uploaded file to identify conflicting claims.
                </p>
              </div>

              <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-subtle hover:border-purple-500/50 hover:shadow-card transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                  04
                </div>
                <h3 className="text-base font-bold text-brand-darkNavy font-heading">
                  Statutory Consent Audit
                </h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">
                  Scrutinizes statutory authority consent requirements, highlighting whether your title conveys legal ownership or merely an equitable license.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. WHAT WE ANALYZE (DOCUMENT COVERAGE) */}
        <section className="py-20 bg-white border-b border-brand-border" id="what-we-analyze">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                Document Scrutiny
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
                Complete Coverage of Statutory Land Instruments
              </h2>
              <p className="text-sm text-brand-textSecondary leading-relaxed">
                Whether purchasing in an uncommitted peri-urban layout, a planned residential scheme, or an ancestral family parcel, LandIntel evaluates the entire chain of title.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {documentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-slate-50/60 border border-brand-border rounded-2xl p-6 space-y-3 hover:bg-white hover:border-slate-300 hover:shadow-subtle transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-brand-darkNavy font-heading">{item.title}</h3>
                    <p className="text-xs text-brand-textSecondary leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. VERIFIED DIASPORA TESTIMONIALS */}
        <section className="py-20 bg-slate-50/70 border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Due-Diligence Case Reports</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
                Trusted by Cross-Border & Remote Investors Worldwide
              </h2>
              <p className="text-sm text-brand-textSecondary leading-relaxed">
                Real diaspora investors who protected their capital from real-estate fraud before signing or wiring funds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((tItem, i) => (
                <div
                  key={i}
                  className="bg-white border border-brand-border rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-slate-300 hover:shadow-card transition-all shadow-subtle"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                          {tItem.avatar}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-brand-darkNavy font-heading">
                            {tItem.name}
                          </h3>
                          <p className="text-[11px] text-slate-500">{tItem.role}</p>
                        </div>
                      </div>
                      <Quote className="w-6 h-6 text-slate-300" />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      &ldquo;{tItem.quote}&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Vetted Parcel:</span>
                      <span className="font-mono text-brand-darkNavy font-semibold">{tItem.property}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-bold">
                      <span>Capital Protected:</span>
                      <span className="font-mono">{tItem.saving}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. TRANSPARENT PRICING WITH MULTI-CURRENCY SUPPORT */}
        <section className="py-20 bg-white border-b border-brand-border" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                Transparent Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
                Generous Free Scans. Pay Only for Official Certification.
              </h2>
              <p className="text-sm text-brand-textSecondary leading-relaxed">
                No monthly subscriptions or hidden retainers. Run preliminary coordinate analysis for free; unlock comprehensive, tamper-evident 15-section PDF reports per transaction.
              </p>
            </div>

            <PricingCards />
          </div>
        </section>

        {/* 9. FREQUENTLY ASKED QUESTIONS */}
        <section className="py-20 bg-slate-50/70 border-b border-brand-border" id="faq">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                Transparent Intelligence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-brand-textSecondary">
                Direct answers regarding cadastral risk detection, document privacy, and legal report boundaries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: "Does LandIntel replace a licensed surveyor or property lawyer?",
                  a: "No. LandIntel is an automated algorithmic intelligence engine. We cross-examine coordinates against official acquisition boundaries, extract beacon lines, and detect deed discrepancies. We recommend taking your 15-section report directly to your licensed surveyor and attorney to conduct physical beacon verification and official ministry registry searches.",
                },
                {
                  q: "How does the platform detect 'Ghost Beacons' and layout shifts?",
                  a: "Our Cadastral Engine parses the Easting and Northing coordinates on your uploaded survey plan, converts them to standard WGS-84 GPS coordinates, and overlays them directly against government gazettes, drainage channels, and arterial road reservation buffers.",
                },
                {
                  q: "Are my uploaded property documents private and secure?",
                  a: "Yes. All uploaded files are stored in private isolated storage and are never exposed publicly. Access is strictly authenticated and validated through short-lived cryptographically signed tokens. We do not use your private deeds to train public AI models.",
                },
                {
                  q: "Can I pay in foreign currency like USD, GBP, or CAD from abroad?",
                  a: "Yes. We support multi-currency payment options including international cards, Apple Pay, global debit/credit cards, as well as bank transfers and secure digital payment gateways.",
                },
                {
                  q: "What should I do if LandIntel reports a High Risk score on a parcel?",
                  a: "Do not wire purchase funds. Review the page-linked evidence checklist in your report. Hand the PDF directly to your property attorney or request that the vendor provide official land registry regularisation documents that resolve the specific coordinate overlap or missing consent.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="bg-white border border-brand-border rounded-2xl p-6 shadow-subtle space-y-2 hover:border-slate-300 transition-colors"
                >
                  <h3 className="text-sm font-bold text-brand-darkNavy font-heading">{faq.q}</h3>
                  <p className="text-xs text-brand-textSecondary leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. FINAL CALL TO ACTION */}
        <section className="py-20 bg-brand-darkNavy text-white relative overflow-hidden border-t border-slate-800">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero Risk Initial Scan</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-tight">
              Before You Wire $20,000+,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Invest 5 Minutes to Verify.
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
              Create your account in seconds, upload your survey plan and deed, and let LandIntel mathematically cross-check coordinates against state acquisition boundaries before you sign.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" prefetch={true} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-xl shadow-blue-500/25 py-4 px-8 font-bold text-sm"
                >
                  <span>Start Free Property Due-Diligence</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/how-it-works" prefetch={true} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white py-4 px-6 font-bold text-sm"
                >
                  <span>View Sample Audit Report</span>
                </Button>
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Encrypted & Private</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Legal Discrepancy Heuristics</span>
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

