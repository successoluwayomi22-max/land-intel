import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { AlertCircle } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-8 text-brand-textPrimary">
        <div className="border-b border-brand-border pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Legal Disclosures</span>
          <h1 className="text-3xl font-extrabold font-heading text-brand-darkNavy mt-1">
            Platform Due-Diligence Disclaimer
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1">Important statutory boundaries and professional review requirements.</p>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-card p-6 flex gap-4 items-start">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs text-amber-900 leading-relaxed">
            <h3 className="font-bold text-sm">Clear Notice on Scope & Authority</h3>
            <p>
              LandIntel provides automated document intelligence, cross-examination, and cadastral risk indicator analysis. It is designed to empower buyers to understand their paperwork and organize inquiries.
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-brand-textSecondary leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">What LandIntel Technology Does:</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong>Algorithmic Boundary Plotting:</strong> Parses survey plan beacon coordinates and plots geographic polygons in UTM Zone 31N/32N and WGS-84 formats.</li>
              <li><strong>Published Gazette &amp; Acquisition Screening:</strong> Cross-references parsed coordinates against known, publicly gazetted acquisitions, arterial road setbacks, and coastal conservation buffers.</li>
              <li><strong>Cross-Document Reconciliation:</strong> Performs deep OCR extraction to detect discrepancies in names, dates, plot numbers, and metric land area across deeds, contracts, and survey plans.</li>
              <li><strong>Tamper-Proof Dossier Generation:</strong> Issues structured 15-section audit reports sealed with unique cryptographic SHA-256 hashes and verifiable QR codes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">What LandIntel Does NOT Do:</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>It does <strong>NOT</strong> establish legal ownership or replace formal root of title.</li>
              <li>It does <strong>NOT</strong> certify cadastral survey plans or authenticate official seals in lieu of the Surveyor General.</li>
              <li>It does <strong>NOT</strong> replace an in-person physical title search at state registries (e.g. Alausa Lands Bureau or AGIS).</li>
              <li>It does <strong>NOT</strong> replace a registered SURCON surveyor or licensed legal practitioner.</li>
              <li>It does <strong>NOT</strong> serve as an insurance policy or underwrite real-estate title guarantees.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">Recommended Statutory Due-Diligence Protocol</h2>
            <p>
              LandIntel is engineered to serve as your preliminary intelligence firewall. Remote buyers and diaspora investors should take their certified LandIntel dossier directly to an independent, accredited property lawyer to file formal registry searches, and commission a licensed SURCON surveyor to verify beacon coordinates on the physical parcel before transferring purchase consideration.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
