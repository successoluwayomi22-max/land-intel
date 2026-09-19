import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-8 text-brand-textPrimary">
        <div className="border-b border-brand-border pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Legal Compliance</span>
          <h1 className="text-3xl font-extrabold font-heading text-brand-darkNavy mt-1">
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-sm max-w-none text-xs leading-relaxed space-y-6 text-brand-textSecondary">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">1. Introduction</h2>
            <p>
              LandIntel (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the LandIntel property due-diligence intelligence platform. We respect your privacy and are committed to protecting the confidential property and personal data you entrust to us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Account Information:</strong> Name, email address, password hashes, and session authentication tokens.</li>
              <li><strong>Property Case Information:</strong> Title, address, cadastral coordinates, vendor and agent names, and consideration amounts.</li>
              <li><strong>Uploaded Property Documents:</strong> Scanned Survey Plans, Deeds of Assignment, Certificates of Occupancy, Gazette excision records, and receipts. These documents may contain sensitive names, boundary coordinates, and historical covenants.</li>
              <li><strong>AI & OCR Processing Data:</strong> Textual tokens, extracted entity attributes, and cross-document comparison vectors.</li>
              <li><strong>Payment Information:</strong> Transaction references, amounts, and settlement statuses processed securely through Paystack. We do not store credit or debit card numbers.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">3. Private Storage & AI Safeguards</h2>
            <p>
              All uploaded property documents are held in private, access-restricted object repositories. Documents are accessed solely through authenticated, short-lived signed tokens. We explicitly do not use your private documents to train public AI foundation models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">4. Data Retention & User Erasure Rights</h2>
            <p>
              Users may request deletion of their account and associated documents at any time via Account Settings. Uploaded documents will be purged from active storage. Financial records and audit trails are retained strictly in compliance with statutory taxation and legal auditing periods.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">5. Contact Information</h2>
            <p>
              For inquiries regarding this Privacy Policy or to exercise your data subject rights, contact our Data Protection team at: <strong>legal@landintel.ng</strong>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
