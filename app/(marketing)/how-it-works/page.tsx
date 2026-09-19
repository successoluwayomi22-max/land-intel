"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function HowItWorksPage() {
  const { t } = useLocale();

  const steps = [
    {
      num: "01",
      title: t("howStep1Title") || "Create a Property Case",
      desc: t("howStep1Desc") || "Provide the property title, state, LGA, street location, and disclosed seller/agent particulars. Add GPS coordinates if available.",
    },
    {
      num: "02",
      title: t("howStep2Title") || "Upload Your Documents Privately",
      desc: t("howStep2Desc") || "Upload scans or PDF copies of Survey Plans, Deeds of Assignment, Certificates of Occupancy, Allocation Letters, or Purchase Receipts.",
    },
    {
      num: "03",
      title: t("howStep3Title") || "Document Classification & Provenance OCR",
      desc: t("howStep3Desc") || "Text extraction and legal heuristics categorize documents, map boundary beacons, extract assignor/assignee names, and preserve page provenance.",
    },
    {
      num: "04",
      title: t("howStep4Title") || "Cross-Document Discrepancy Examination",
      desc: t("howStep4Desc") || "The engine compares identifiers across files—such as checking whether the Survey Plan's beacon numbers and plot references match the Deed covenants.",
    },
    {
      num: "05",
      title: t("howStep5Title") || "Risk Score & Verification Checklist",
      desc: t("howStep5Desc") || "Review your explainable 0–100 Risk Indicator Score, examine identified flags, and track progress through an 11-point cadastral checklist.",
    },
    {
      num: "06",
      title: t("howStep6Title") || "Download Genuine PDF Due-Diligence Report",
      desc: t("howStep6Desc") || "Unlock the full 15-section report via Paystack in your preferred local currency (₦45,000 / $30 USD). Download a publication-grade PDF certification to send to your surveyor and lawyer.",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
            {t("platformWorkflow") || "Platform Workflow"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            {t("howItWorksTitle") || "How LandIntel Works"}
          </h1>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            {t("howItWorksSubtitle") || "From raw scanned documents to an explainable land-risk intelligence report in minutes."}
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.num} className="bg-white p-6 rounded-card border border-brand-border shadow-subtle flex flex-col sm:flex-row gap-5 items-start">
              <span className="text-2xl font-extrabold font-heading text-brand-blue shrink-0">
                {step.num}
              </span>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-brand-textPrimary font-heading">{step.title}</h3>
                <p className="text-xs text-brand-textSecondary leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-6">
          <Link href="/register" prefetch={true}>
            <Button variant="primary" size="lg">
              <span>{t("register") || "Start Your Property Investigation"}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
