"use client";

import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function FAQPage() {
  const { t } = useLocale();

  const faqs = [
    {
      q: t("faqQ1") || "Does LandIntel establish legal ownership or certify title?",
      a: t("faqA1") || "No. LandIntel is an advanced property due-diligence intelligence platform. It analyzes submitted documents, cross-examines coordinates against official acquisition boundaries, identifies discrepancies, and organizes evidence. It does NOT establish legal ownership, certify title, confirm government approval, or replace registered surveyors and legal representation.",
    },
    {
      q: t("faqQ2") || "How does the system identify plot and beacon inconsistencies?",
      a: t("faqA2") || "Our cadastral heuristics extract beacon numbers, plot identifiers, surveyor registration references, and land areas. The cross-document engine flags variances between documents (e.g., Plot 24 in the survey vs Plot 42 in the deed) to prevent rival ownership conflicts.",
    },
    {
      q: t("faqQ3") || "Are my uploaded property documents private?",
      a: t("faqA3") || "Yes. All uploaded files are stored in private isolated storage and are never exposed publicly. Access is strictly authenticated and validated through short-lived cryptographically signed tokens. We do not use your private documents to train public AI models.",
    },
    {
      q: t("faqQ4") || "What payment methods are supported for unlocking reports?",
      a: t("faqA4") || "We support global debit/credit cards, bank transfers, and digital payment options with multi-currency checkout available for international and remote investors.",
    },
    {
      q: t("faqQ5") || "What if my documents are photocopies or blurry scans?",
      a: t("faqA5") || "Our multi-pass OCR extracts legible text and flags uncertain items as 'Uncertain' rather than inventing data. If a beacon number is unreadable, we advise physical beacon pickup by a surveyor on site.",
    },
    {
      q: t("faqQ6") || "Can my property lawyer or surveyor review the generated report?",
      a: t("faqA6") || "Yes. The generated 15-section PDF report is formatted specifically for professional review. It includes targeted questions to ask your surveyor at the Surveyor General's office and questions for your property attorney at the Lands Bureau.",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
            {t("dueDiligenceFaq") || "Help Center"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            {t("faq") || "Frequently Asked Questions"}
          </h1>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            {t("faqSubtitle") || "Detailed answers regarding property due diligence, cadastral coordinates, and title certification."}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-brand-border rounded-card p-6 shadow-subtle space-y-2">
              <h3 className="text-sm font-bold text-brand-textPrimary font-heading">{faq.q}</h3>
              <p className="text-xs text-brand-textSecondary leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
