"use client";

import React from "react";
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
} from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { PricingCards } from "@/components/marketing/PricingCards";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function LandingPage() {
  const { t } = useLocale();

  const problemCards = [
    {
      num: "01",
      title: t("problem1Title") || "Plot & Beacon Mismatches",
      desc:
        t("problem1Desc") ||
        "The vendor delivers a registered survey for Plot 24, but the Deed of Assignment conveys Plot 42 or an adjacent layout parcel, leading to rival claims.",
      theme: "rose",
    },
    {
      num: "02",
      title: t("problem2Title") || "Unconsented Root of Title",
      desc:
        t("problem2Desc") ||
        "Deeds transferring interest without requisite statutory Governor's consent under the Land Use Act 1978 leave buyers with legally incomplete equitable claims.",
      theme: "amber",
    },
    {
      num: "03",
      title: t("problem3Title") || "Uncharted Coordinates",
      desc:
        t("problem3Desc") ||
        "Land sold with promises of 'excision in progress' that actually overlaps committed government acquisitions, road setbacks, or flood drainage plains.",
      theme: "blue",
    },
  ];

  const lifecycleSteps = [
    {
      step: "01",
      title: t("step1Title") || "Create Case",
      desc: t("step1Desc") || "Specify state, LGA, parcel address, vendor names, and cadastral GPS coordinates.",
    },
    {
      step: "02",
      title: t("step2Title") || "Upload Files",
      desc: t("step2Desc") || "Submit Survey Plans, Deeds, C of O, Gazette Excision, or receipts in private storage.",
    },
    {
      step: "03",
      title: t("step3Title") || "Extraction",
      desc: t("step3Desc") || "OCR & legal heuristics map beacon coordinates, plot numbers, and assignor lineage.",
    },
    {
      step: "04",
      title: t("step4Title") || "Cross-Check",
      desc: t("step4Desc") || "Algorithms cross-compare documents for inconsistencies, missing consent, or variances.",
    },
    {
      step: "05",
      title: t("step5Title") || "PDF Report",
      desc: t("step5Desc") || "Receive an explainable Risk Score, 11-point checklist, and authentic PDF report.",
    },
  ];

  const documentItems = [
    {
      title: t("doc1Title") || "Cadastral Survey Plans",
      desc:
        t("doc1Desc") ||
        "Beacon boundary numbers, surveyor SURCON accreditation, coordinate plotting, and area dimensions.",
    },
    {
      title: t("doc2Title") || "Deeds of Assignment",
      desc:
        t("doc2Desc") ||
        "Title covenants, assignor/assignee lineage, consideration tranches, and statutory execution stamps.",
    },
    {
      title: t("doc3Title") || "Certificate of Occupancy (C of O)",
      desc:
        t("doc3Desc") ||
        "State registration volumes, 99-year leasehold commencement dates, and designated land use.",
    },
    {
      title: t("doc4Title") || "Governor's Consent",
      desc:
        t("doc4Desc") ||
        "Endorsements by State Land Commissioners validating legal transfer of statutory occupancy rights.",
    },
    {
      title: t("doc5Title") || "Government Gazette Notices",
      desc:
        t("doc5Desc") ||
        "Excision notices, formal gazette volume numbers, and de-acquisition releases.",
    },
    {
      title: t("doc6Title") || "Allocation Letters & Receipts",
      desc:
        t("doc6Desc") ||
        "Developer allocations, provisional booking terms, and family acknowledgment receipts.",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main id="main-content" className="flex-1">
        {/* 1. HERO SECTION */}
        <HeroSection />

        {/* 2. TRUST / VALUE STATEMENT */}
        <section className="py-12 bg-white border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-textPrimary font-heading">
                    {t("evidenceTitle") || "Evidence-Driven Provenance"}
                  </h3>
                <p className="text-xs text-brand-textSecondary mt-1 leading-relaxed">
                  {t("evidenceDesc") ||
                    "Every finding links directly to specific document pages, beacon numbers, and covenant clauses. No synthetic guesswork."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-textPrimary font-heading">
                  {t("privateStorageTitle") || "Private & Isolated Storage"}
                </h3>
                <p className="text-xs text-brand-textSecondary mt-1 leading-relaxed">
                  {t("privateStorageDesc") ||
                    "Documents are stored in private encrypted repositories. Documents are never public and are accessed solely via temporary signed tokens."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-textPrimary font-heading">
                  {t("transparentRiskTitle") || "Transparent Risk Scoring"}
                </h3>
                <p className="text-xs text-brand-textSecondary mt-1 leading-relaxed">
                  {t("transparentRiskDesc") ||
                    "Explainable 0–100 score breaking down documentation, ownership, geographic, and consistency weights."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM SECTION */}
      <section className="py-20 bg-brand-background border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              {t("realityTag") || "The Reality of Remote Buying"}
            </span>
            <h2 className="text-3xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
              {t("realityTitle") || "Buying Property in Nigeria from Abroad Carries Subtle Cadastral Pitfalls"}
            </h2>
            <p className="text-sm text-brand-textSecondary leading-relaxed">
              {t("realitySubtitle") ||
                "Real-estate transactions in Lagos, Abuja, and other growth hubs frequently encounter conflicting paperwork that appears legitimate at casual glance."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problemCards.map((p) => (
              <div key={p.num} className="bg-white border border-brand-border rounded-card p-6 shadow-subtle space-y-3">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                    p.theme === "rose"
                      ? "bg-rose-50 text-rose-600"
                      : p.theme === "amber"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-blue-50 text-brand-blue"
                  }`}
                >
                  {p.num}
                </div>
                <h3 className="text-base font-bold text-brand-textPrimary font-heading">{p.title}</h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-20 bg-white border-b border-brand-border" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              {t("lifecycleTag") || "Due-Diligence Lifecycle"}
            </span>
            <h2 className="text-3xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
              {t("lifecycleTitle") || "Five Systematic Steps to Complete Clarity"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {lifecycleSteps.map((s) => (
              <div key={s.step} className="bg-slate-50 border border-brand-border rounded-card p-4 space-y-2">
                <span className="font-heading font-extrabold text-lg text-brand-blue block">{s.step}</span>
                <h3 className="text-sm font-bold text-brand-textPrimary font-heading">{s.title}</h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHAT WE ANALYZE */}
      <section className="py-20 bg-brand-background border-b border-brand-border" id="what-we-analyze">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              {t("docCoverageTag") || "Document Coverage"}
            </span>
            <h2 className="text-3xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
              {t("docCoverageTitle") || "What LandIntel Evaluates"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {documentItems.map((item) => (
              <div key={item.title} className="bg-white border border-brand-border rounded-card p-5 shadow-subtle space-y-2">
                <FileText className="w-5 h-5 text-brand-blue" />
                <h3 className="text-sm font-bold text-brand-textPrimary font-heading">{item.title}</h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section className="py-20 bg-white border-b border-brand-border" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              {t("pricing") || "Transparent Pricing"}
            </span>
            <h2 className="text-3xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
              {t("reportPriceTitle") || "Generous Free Access. Pay Only for In-Depth Due-Diligence Certification."}
            </h2>
            <p className="text-sm text-brand-textSecondary leading-relaxed">
              {t("heroSubtitle") ||
                "No subscription traps. Normal registered users experience core property analysis for free; unlock comprehensive 15-section PDF reports per transaction."}
            </p>
          </div>

          <PricingCards />
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="py-20 bg-brand-background border-b border-brand-border" id="faq">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              {t("dueDiligenceFaq") || "Got Questions?"}
            </span>
            <h2 className="text-3xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
              {t("faq") || "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Does LandIntel establish legal ownership or certify title?",
                a: "No. LandIntel is an advanced property due-diligence intelligence platform. It analyzes submitted documents, cross-examines cadastral coordinates against government acquisition boundaries, identifies discrepancies, and organizes evidence. It empowers buyers with defensible findings, but does NOT establish legal ownership, certify title, or replace licensed surveyors and property lawyers.",
              },
              {
                q: "How does the system compare Survey Plans and Deeds of Assignment?",
                a: "Our cadastral heuristics extract beacon numbers, plot identifiers, surveyor registration references, and land areas. The cross-document engine flags variances between documents (e.g., Plot 24 in the survey vs Plot 42 in the deed) to prevent rival ownership conflicts.",
              },
              {
                q: "Are my uploaded property documents private?",
                a: "Yes. All uploaded files are stored in private isolated storage and are never exposed publicly. Access is strictly authenticated and validated through short-lived cryptographically signed tokens. We do not use your private documents to train public AI models.",
              },
              {
                q: "What payment methods are supported for unlocking reports?",
                a: "We support Nigerian debit cards, bank transfers, and USSD directly through Paystack (in NGN), with multi-currency payment options available for diaspora buyers.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-brand-border rounded-card p-5 shadow-subtle space-y-2">
                <h3 className="text-sm font-bold text-brand-textPrimary font-heading">{faq.q}</h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="py-20 bg-brand-darkNavy text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">
            {t("heroTitle") || "Protect Your Capital Before Signing or Transferring Funds"}
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            {t("heroSubtitle") ||
              "Create your free account today, enter your property details, and experience automated cross-document intelligence."}
          </p>
          <div className="pt-2">
            <Link href="/register" prefetch={true}>
              <Button variant="primary" size="lg">
                <span>{t("register") || "Start Your Property Investigation"}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
