import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-8 text-brand-textPrimary">
        <div className="border-b border-brand-border pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Legal Terms</span>
          <h1 className="text-3xl font-extrabold font-heading text-brand-darkNavy mt-1">
            Terms of Service
          </h1>
        </div>

        <div className="prose prose-sm max-w-none text-xs leading-relaxed space-y-6 text-brand-textSecondary">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">1. Nature of the Service</h2>
            <p>
              LandIntel provides automated document intelligence, cross-examination, and cadastral risk indicator analysis for real-estate due diligence. The platform is designed to assist buyers in spotting discrepancies, organizing evidence, and formulating inquiries for qualified professionals.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">2. No Legal or Surveying Certification</h2>
            <p>
              LandIntel does <strong>NOT</strong> provide legal advice, issue title certifications, confirm official government approvals, guarantee authenticity of unverified seals, or replace licensed surveyors and property lawyers. Real-estate transactions require formal land registry searches and on-ground beacon pickup by certified professionals.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">3. User Obligations & Uploaded Content</h2>
            <p>
              You warrant that you have lawful authority to possess and upload property documents for the purpose of bona fide due-diligence review. You agree not to upload fraudulent files or attempt prompt-injection attacks against processing pipelines.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">4. Payment & Report Unlocking</h2>
            <p>
              Free users receive preliminary risk scores and document checklists. Access to full 15-section PDF reports and detailed evidence citations requires a one-time report unlock fee processed securely via Paystack. Fees are non-refundable once the full report has been generated and delivered.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, LandIntel and its operators shall not be liable for any direct, indirect, incidental, or consequential losses, land title defects, boundary disputes, or transaction failures arising out of property acquisitions.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
