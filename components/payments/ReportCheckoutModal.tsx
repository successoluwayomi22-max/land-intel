"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Building,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  Globe,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useLocale, CURRENCIES } from "@/components/providers/LocaleProvider";
import { CountryFlag } from "@/components/ui/CountryFlags";
import { calculatePriceTaxBreakdown, ONE_OFF_PACKAGES, OneOffPackageKey } from "@/lib/services/plans";

interface ReportCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  propertyTitle: string;
  initialPackageType?: OneOffPackageKey;
  onSuccess: () => void;
}

type PaymentTab = "paystack" | "international_card" | "wire_transfer" | "instant_test";

export const ReportCheckoutModal: React.FC<ReportCheckoutModalProps> = ({
  isOpen,
  onClose,
  caseId,
  propertyTitle,
  initialPackageType = "STANDARD_AUDIT",
  onSuccess,
}) => {
  const { currency, formatPrice } = useLocale();
  const [selectedPackage, setSelectedPackage] = useState<OneOffPackageKey>(initialPackageType);
  const [activeTab, setActiveTab] = useState<PaymentTab>("paystack");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Card state for international card demo
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Wire transfer reference state
  const [wireRef, setWireRef] = useState("");

  // Synchronize initial package type when modal opens
  useEffect(() => {
    if (initialPackageType) {
      setSelectedPackage(initialPackageType);
    }
  }, [initialPackageType, isOpen]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPkg = ONE_OFF_PACKAGES[selectedPackage] || ONE_OFF_PACKAGES.STANDARD_AUDIT;
  const taxBreakdown = calculatePriceTaxBreakdown(currentPkg.priceNgn);
  const formattedSubtotal = formatPrice(taxBreakdown.subtotal);
  const formattedVat = formatPrice(taxBreakdown.vatAmount);
  const formattedTotal = formatPrice(taxBreakdown.total, { showCode: true });

  const handlePaystackPay = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          packageType: selectedPackage,
          method: "PAYSTACK",
          currency: "NGN",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize Paystack gateway");
      }

      if (data.isUnlocked || data.alreadyUnlocked) {
        onSuccess();
        onClose();
        return;
      }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error("Missing payment authorization link.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment initialization failed. Please try another method.");
      setLoading(false);
    }
  };

  const handleDirectUnlock = async (method: "SANDBOX" | "WIRE" | "CARD") => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          packageType: selectedPackage,
          method: method === "CARD" ? "INSTANT" : method,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        {/* Modal Header */}
        <div className="bg-[#0B132B] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                <span>Unlock 15-Section Cadastral Audit Report</span>
              </h2>
              <span className="text-xs text-slate-400 block truncate max-w-sm">
                Case: <strong className="text-slate-200">{propertyTitle}</strong>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Amount Banner with Statutory VAT Breakdown */}
        <div className="border-b px-6 py-4 space-y-2.5 bg-emerald-50/80 text-slate-900 border-emerald-200/80">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider block text-emerald-900">
                Official Certification Fee
              </span>
              <span className="text-xs block mt-0.5 text-emerald-700">
                Automated 15-section audit, beacon matrix &amp; risk scorecard
              </span>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-2xl font-black font-heading block text-emerald-900">
                  {formattedTotal}
                </span>
                <span className="text-xs font-medium text-emerald-700">
                  / property
                </span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5 border text-emerald-700 bg-emerald-100/70 border-emerald-300/60">
                7.5% VAT Included
              </span>
            </div>
          </div>

          {/* Itemized Tax Breakdown Box */}
          <div className="rounded-xl p-2.5 text-xs space-y-1 border bg-white/80 border-emerald-200/70 text-slate-600">
            <div className="flex justify-between text-[11px]">
              <span>Base Search &amp; Audit Fee:</span>
              <span className="font-semibold text-slate-800">
                {formattedSubtotal}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center gap-1">
                <span>Statutory Value Added Tax (VAT 7.5%):</span>
              </span>
              <span className="font-semibold text-emerald-800">
                +{formattedVat}
              </span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1 text-xs border-slate-100 text-slate-900">
              <span>Total Amount Due:</span>
              <span className="font-black text-emerald-900">
                {formattedTotal}
              </span>
            </div>
          </div>

          {/* Deliverables */}
          <div className="border-t border-emerald-200/60 pt-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-1.5">
              Automated Due-Diligence Deliverables:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
              {currentPkg.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className={idx === 0 ? "font-bold text-emerald-950" : ""}>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Payment Method Tabs */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("paystack")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === "paystack"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500/30"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex justify-center mb-1">
                  <CountryFlag countryCode="NG" size={16} />
                </div>
                <span className="text-xs block font-bold">Paystack</span>
                <span className="text-[10px] opacity-75 block">Naija Cards/Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("international_card")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === "international_card"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500/30"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="text-xs block font-bold">Global Card</span>
                <span className="text-[10px] opacity-75 block">Visa/Mastercard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("wire_transfer")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === "wire_transfer"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500/30"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <Building className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="text-xs block font-bold">Bank Wire</span>
                <span className="text-[10px] opacity-75 block">Direct Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("instant_test")}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  activeTab === "instant_test"
                    ? "border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-xs ring-1 ring-amber-500/30"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <Sparkles className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <span className="text-xs block font-bold">Test Sandbox</span>
                <span className="text-[10px] text-amber-700 font-semibold block">Instant Demo</span>
              </button>
            </div>
          </div>

          {/* TAB 1: PAYSTACK */}
          {activeTab === "paystack" && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Direct Card / Bank Transfer Gateway</span>
                <span className="text-[11px] font-bold font-mono text-emerald-700">
                  {formatPrice(taxBreakdown.total, { showCode: true })}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seamlessly pay with Mastercard, Visa, Verve, direct Bank Transfer, or USSD via secured instant checkout. Your certified audit report unlocks automatically upon payment.
              </p>
              <button
                type="button"
                onClick={handlePaystackPay}
                disabled={loading}
                className="w-full py-3 px-4 disabled:opacity-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Paystack Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Certified Report ({formatPrice(taxBreakdown.total)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: INTERNATIONAL CARD */}
          {activeTab === "international_card" && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Diaspora Debit &amp; Credit Cards</span>
                <span className="text-[11px] font-bold text-emerald-700">{formattedTotal}</span>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Card Number (e.g. 4242 •••• •••• 4242)"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <input
                    type="text"
                    placeholder="CVC / CVV"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDirectUnlock("CARD")}
                disabled={loading}
                className="w-full py-3 px-4 disabled:opacity-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Global Card...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Certified Report ({formattedTotal})</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: WIRE TRANSFER */}
          {activeTab === "wire_transfer" && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800 block">
                Diaspora Direct Settlement Coordinates:
              </span>
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-bold text-slate-800">Wema Bank PLC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="font-bold text-slate-800">LandIntel Technologies Ltd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-bold text-emerald-700">0238491823</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Routing / Swift:</span>
                  <span className="font-bold text-slate-800">WEMANGLA</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Transfer Reference / Sender Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN-839201 or Sender Full Name"
                  value={wireRef}
                  onChange={(e) => setWireRef(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDirectUnlock("WIRE")}
                disabled={loading}
                className="w-full py-3 px-4 disabled:opacity-50 text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming Wire Transfer...</span>
                  </>
                ) : (
                  <>
                    <span>I Have Sent Wire Transfer &bull; Unlock Report ({formattedTotal})</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 4: INSTANT SANDBOX DEMO */}
          {activeTab === "instant_test" && (
            <div className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Instant Developer &amp; Reviewer Sandbox</span>
              </div>
              <p className="text-amber-900/80 leading-relaxed text-[11px]">
                Simulate instant approval without charging a real card. This will immediately mark the case report as unlocked so you can test and view the complete analysis.
              </p>
              <button
                type="button"
                onClick={() => handleDirectUnlock("SANDBOX")}
                disabled={loading}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Sandbox Unlock...</span>
                  </>
                ) : (
                  <>
                    <span>Simulate Instant Unlock ({formattedTotal} Demo)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Trust badges */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Global Multi-Currency</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
