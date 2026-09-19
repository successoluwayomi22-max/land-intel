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
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">What LandIntel Does NOT Do:</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>It does <strong>NOT</strong> establish legal ownership or root of title.</li>
              <li>It does <strong>NOT</strong> certify cadastral survey plans or authenticate official seals.</li>
              <li>It does <strong>NOT</strong> confirm government approval, gazette status, or excision validity without official ministry verification.</li>
              <li>It does <strong>NOT</strong> replace a certified, registered surveyor (SURCON).</li>
              <li>It does <strong>NOT</strong> replace a qualified real estate lawyer or Nigerian legal counsel.</li>
              <li>It does <strong>NOT</strong> guarantee that any real-estate transaction will succeed or is free from fraud.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">Recommended Action Protocol</h2>
            <p>
              Buyers should always take the generated findings and questions from LandIntel to an independent property attorney to conduct a search at the State Lands Bureau (e.g. Alausa or AGIS), and commission a registered surveyor to chart the boundary beacons directly on site.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
