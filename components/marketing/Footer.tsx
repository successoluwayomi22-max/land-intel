"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePlatformContact } from "@/components/providers/PlatformContactProvider";

export const Footer: React.FC = () => {
  const { t } = useLocale();
  const { contact } = usePlatformContact();
  const [currentYear, setCurrentYear] = React.useState<number>(() => new Date().getFullYear());

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-brand-darkNavy text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800 text-xs">
          {/* Brand col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white">
                L
              </div>
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                LandIntel
              </span>
            </Link>
            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
              {t("footerTagline") ||
                "Global Land Solutions — Securing High-Value Real Estate for Remote & Diaspora Investors. Independent cadastral verification, document provenance analysis, and title intelligence."}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t("privateStorageEncrypted") || "Private object storage • Encrypted data transmission"}</span>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              {t("product") || "Product"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  {t("howItWorks") || "How It Works"}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  {t("pricing") || "Pricing"}
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-white transition-colors">
                  {t("security") || "Security"}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  {t("faq") || "FAQ"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Account */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              {t("contactAndSupport") || "Contact & Support"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {t("supportDesk") || "Support Desk"}
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/${(contact.primaryWhatsapp || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                >
                  WhatsApp: {contact.primaryWhatsapp}
                </a>
              </li>
              <li>
                <a
                  href={contact.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  Facebook: {contact.facebook}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email || "successoluwayomi22@gmail.com"}`}
                  className="hover:text-white transition-colors break-all"
                  title="Contact Support"
                >
                  {contact.displayEmail || "support@landintel.ai"}
                </a>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t("aboutUs") || "About Us"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              {t("legalAndTrust") || "Legal & Trust"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {t("privacyPolicy") || "Privacy Policy"}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  {t("termsOfService") || "Terms of Service"}
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors">
                  {t("legalDisclaimer") || "Legal Disclaimer"}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  {t("cookiePolicy") || "Cookie Policy"}
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="hover:text-white transition-colors">
                  {t("acceptableUse") || "Acceptable Use"}
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  {t("refundPolicy") || "Refund Policy"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <p suppressHydrationWarning>
            © {currentYear} LandIntel — Global Land Intelligence. {t("allRightsReserved") || "All rights reserved."}
          </p>
          <p className="text-center md:text-right max-w-xl text-slate-400">
            {APP_CONFIG.legalDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
