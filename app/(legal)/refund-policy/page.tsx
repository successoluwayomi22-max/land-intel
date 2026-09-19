import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-8 text-brand-textPrimary">
        <div className="border-b border-brand-border pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Billing Terms</span>
          <h1 className="text-3xl font-extrabold font-heading text-brand-darkNavy mt-1">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1">Clear rules governing one-time due-diligence report unlocks.</p>
        </div>

        <div className="prose prose-sm max-w-none text-xs leading-relaxed space-y-6 text-brand-textSecondary">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">1. Digital Goods Delivery</h2>
            <p>
              Due to the immediate digital delivery of full due-diligence reports and generated PDF assets, report unlock payments (₦45,000 NGN) are generally non-refundable once the full report has been made accessible to your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">2. Duplicate Charges & Technical Errors</h2>
            <p>
              If you experience a duplicate payment or a server error where your payment is verified but the report fails to unlock within 24 hours, contact <strong>support@landintel.ng</strong> with your Paystack transaction reference for immediate reconciliation or full refund.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
