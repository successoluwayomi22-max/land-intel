"use client";

import React from "react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Lock, Key, EyeOff, FileCheck } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function SecurityPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
            {t("securityArch") || "Security & Privacy Architecture"}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            {t("enterpriseDocSecurity") || "Enterprise Document Security"}
          </h1>
          <p className="text-sm text-brand-textSecondary leading-relaxed">
            {t("securitySubtitle") ||
              "Property records and Survey Plans contain sensitive personal identifiers. Here is how LandIntel safeguards your data."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-card border border-brand-border shadow-subtle space-y-2">
            <Lock className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-brand-textPrimary font-heading">
              {t("privateStorageFeature") || "Private Object Storage"}
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              {t("privateStorageFeatureDesc") ||
                "Documents are never uploaded to public buckets or public CDN links. Files are isolated in private storage accessible only via short-lived cryptographically signed tokens."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-brand-border shadow-subtle space-y-2">
            <EyeOff className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-brand-textPrimary font-heading">
              {t("zeroTraining") || "Zero Training on User Documents"}
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              {t("zeroTrainingDesc") ||
                "We never use uploaded Survey Plans, Deeds, or customer covenants to train public AI foundation models. Your files remain your confidential property."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-brand-border shadow-subtle space-y-2">
            <Key className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-brand-textPrimary font-heading">
              {t("strictIdor") || "Strict IDOR Protection"}
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              {t("strictIdorDesc") ||
                "Every API request enforces multi-tenant ownership validation. User A can never access User B's cases, documents, or reports by manipulating identifiers."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-card border border-brand-border shadow-subtle space-y-2">
            <FileCheck className="w-6 h-6 text-brand-blue" />
            <h3 className="text-base font-bold text-brand-textPrimary font-heading">
              {t("serverSideEntitlements") || "Server-Side Entitlement Enforced"}
            </h3>
            <p className="text-xs text-brand-textSecondary leading-relaxed">
              {t("serverSideEntitlementsDesc") ||
                "All payment and premium feature gating is evaluated server-side. Unlocked data is redacted from the API response for free users, preventing client-side inspection leaks."}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
