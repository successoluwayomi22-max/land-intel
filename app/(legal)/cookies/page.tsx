import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-8 text-brand-textPrimary">
        <div className="border-b border-brand-border pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Cookie Policy</span>
          <h1 className="text-3xl font-extrabold font-heading text-brand-darkNavy mt-1">
            Cookie Policy
          </h1>
        </div>

        <div className="prose prose-sm max-w-none text-xs leading-relaxed space-y-6 text-brand-textSecondary">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">1. How We Use Cookies</h2>
            <p>
              LandIntel uses strictly necessary session cookies and tokens to authenticate users, manage secure login sessions, and protect against Cross-Site Request Forgery (CSRF). We do not use third-party behavioral advertising or tracking cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-brand-textPrimary font-heading">2. Managing Cookies</h2>
            <p>
              You can control cookies through your web browser settings. Disabling necessary session cookies will prevent login and authenticated case management from functioning.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
