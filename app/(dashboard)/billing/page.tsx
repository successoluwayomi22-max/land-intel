"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Download,
  RefreshCw,
  XCircle,
  HelpCircle,
  Layers,
  FileText,
  Sparkles,
  Zap,
  Printer,
  X,
  Receipt,
  Percent,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale, SupportedCurrency, CURRENCIES } from "@/components/providers/LocaleProvider";
import { calculatePriceTaxBreakdown, STATUTORY_VAT_RATE, ONE_OFF_PACKAGES, OneOffPackageKey } from "@/lib/services/plans";
import { ReportCheckoutModal } from "@/components/payments/ReportCheckoutModal";

const DEFAULT_PLANS = [
  {
    key: "STARTER",
    name: "Starter Investor",
    priceNgn: 45000,
    priceUsd: 30,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 48375,
    totalPriceUsd: 32.25,
    maxActiveCases: 5,
    maxDocumentsPerCase: 15,
    maxAiQuestionsPerCase: 25,
  },
  {
    key: "PROFESSIONAL",
    name: "Professional Portfolio",
    priceNgn: 125000,
    priceUsd: 85,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 134375,
    totalPriceUsd: 91.38,
    maxActiveCases: 25,
    maxDocumentsPerCase: 50,
    maxAiQuestionsPerCase: 100,
  },
  {
    key: "BUSINESS",
    name: "Commercial & Firm",
    priceNgn: 350000,
    priceUsd: 235,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 376250,
    totalPriceUsd: 252.63,
    maxActiveCases: 100,
    maxDocumentsPerCase: 100,
    maxAiQuestionsPerCase: 300,
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise Sovereign",
    priceNgn: 1500000,
    priceUsd: 999,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 1612500,
    totalPriceUsd: 1073.93,
    maxActiveCases: 10000,
    maxDocumentsPerCase: 500,
    maxAiQuestionsPerCase: 1000,
  },
];

export default function BillingPage() {
  const { currency, setCurrency, formatPrice, liveRates, t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [includeVat, setIncludeVat] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyForCheckout, setSelectedPropertyForCheckout] = useState<any | null>(null);
  const [checkoutPackageType, setCheckoutPackageType] = useState<OneOffPackageKey>("STANDARD_AUDIT");
  const [propertySelectModalOpen, setPropertySelectModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const fetchBillingData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [subRes, usageRes, paymentsRes, plansRes, propsRes] = await Promise.all([
        fetch("/api/v1/billing/subscription"),
        fetch("/api/v1/billing/usage"),
        fetch("/api/v1/billing/payments"),
        fetch("/api/v1/billing/plans"),
        fetch("/api/properties"),
      ]);

      if (subRes.ok) {
        const d = await subRes.json();
        setSubscription(d.subscription);
      }
      if (usageRes.ok) {
        const d = await usageRes.json();
        setUsage(d.usage);
      }
      if (paymentsRes.ok) {
        const d = await paymentsRes.json();
        setPayments(d.payments || []);
      }
      if (plansRes.ok) {
        const d = await plansRes.json();
        if (d.plans && d.plans.length > 0) {
          setPlans(d.plans);
        }
      }
      if (propsRes.ok) {
        const pData = await propsRes.json();
        setProperties(pData.cases || pData.propertyCases || []);
      }
    } catch (err: any) {
      console.error("[BILLING_FETCH_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateOneOffPackage = (pkgKey: OneOffPackageKey) => {
    setCheckoutPackageType(pkgKey);
    if (!properties || properties.length === 0) {
      window.location.href = `/properties/new?package=${pkgKey}`;
      return;
    }
    if (properties.length === 1) {
      setSelectedPropertyForCheckout(properties[0]);
      setCheckoutModalOpen(true);
      return;
    }
    setPropertySelectModalOpen(true);
  };

  const handleSelectPropertyForCheckout = (prop: any) => {
    setSelectedPropertyForCheckout(prop);
    setPropertySelectModalOpen(false);
    setCheckoutModalOpen(true);
  };

  useEffect(() => {
    // Instant fetch in background without blocking initial render
    fetchBillingData(true);
  }, []);

  // Lock body scroll when receipt modal is open
  useEffect(() => {
    if (selectedReceipt) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedReceipt]);

  const handleUpgradePlan = async (planKey: string) => {
    setActionLoading(`upgrade_${planKey}`);
    setFeedback(null);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout initiation failed");

      if (data.session?.authorizationUrl) {
        window.location.href = data.session.authorizationUrl;
      } else {
        setFeedback({ type: "success", message: `Plan upgraded to ${planKey} successfully!` });
        await fetchBillingData();
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? Your access will remain active until the end of the billing period.")) {
      return;
    }
    setActionLoading("cancel");
    setFeedback(null);
    try {
      const res = await fetch("/api/v1/billing/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediate: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");
      setFeedback({ type: "success", message: data.message || "Subscription cancelled" });
      await fetchBillingData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading("reactivate");
    setFeedback(null);
    try {
      const res = await fetch("/api/v1/billing/subscription/reactivate", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reactivation failed");
      setFeedback({ type: "success", message: "Subscription reactivated successfully!" });
      await fetchBillingData();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const currentPlanKey = subscription?.plan?.key || "FREE";

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-heading">
            Billing & Subscriptions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your Landintel plan, usage quotas, entitlements, and payment receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBillingData()}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Link href="/contact">
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs text-slate-600">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Billing Support</span>
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Plan Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Plan</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  subscription?.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : subscription?.status === "CANCELLED"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {subscription?.status || "FREE"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              {subscription?.plan?.name || "Free Preview"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {currentPlanKey !== "FREE" || subscription?.status === "ACTIVE"
                ? "Full access to verified audits, boundary checks & PDF downloads."
                : "Free tier with preliminary risk analysis."}
            </p>
          </div>

          {subscription?.id && subscription?.provider && subscription.provider !== "NONE" && subscription.provider !== "MANUAL" && subscription?.cancelAtPeriodEnd ? (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs text-amber-600 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Recurring billing paused</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={handleReactivateSubscription}
                disabled={actionLoading === "reactivate"}
              >
                Reactivate Subscription
              </Button>
            </div>
          ) : subscription?.id && subscription?.provider && subscription.provider !== "NONE" && subscription.provider !== "MANUAL" && currentPlanKey !== "FREE" ? (
            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={handleCancelSubscription}
                disabled={actionLoading === "cancel"}
              >
                Cancel Recurring Billing
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <Link href="#plans" className="block w-full">
                <Button variant="primary" size="sm" className="w-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white">
                  Unlock New Property Audit
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quota & Usage Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Quota Consumption</span>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Active Cases</span>
                <span className="font-mono">
                  {usage?.casesCreated || 0} / {usage?.maxCases || 1}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-blue h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((usage?.casesCreated || 0) / (usage?.maxCases || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>AI Assistant Inquiries</span>
                <span className="font-mono">
                  {usage?.aiQuestionsUsed || 0} / {usage?.maxAiQuestions || 5}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((usage?.aiQuestionsUsed || 0) / (usage?.maxAiQuestions || 5)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Certified Reports</span>
                <span className="font-mono">{usage?.reportsGenerated || 0} generated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Gateways */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment & Security</span>
            <div className="flex items-center gap-2 mt-3 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>PCI-DSS Compliant Gateway</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              All transactions are cryptographically signed and secured via <strong>Paystack</strong> and{" "}
              <strong>Stripe</strong>. No card credentials touch Landintel servers.
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Provider: <strong className="text-slate-600 font-mono">{subscription?.provider || "PAYSTACK"}</strong>
          </div>
        </div>
      </div>

      {/* SECTION: Pay-Per-Property Legal Search Packages (No Monthly Commitment) */}
      <div id="packages" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                Pay-Per-Property Legal Search Packages
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                No Subscription Required
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              One-off title verification, physical site inspection, ministry charting, and publication-grade cadastral audit with statutory 7.5% VAT itemization.
            </p>
          </div>
          <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            ✓ 7.5% Statutory VAT Included &bull; Lifetime Access
          </span>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Card 1: Standard Cadastral Audit (100% Automated) */}
          <div className="bg-white border-2 border-emerald-600 rounded-2xl p-6 shadow-md space-y-6 flex flex-col justify-between relative hover:shadow-lg transition-all">
            <span className="absolute -top-3 right-6 bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
              Instant Automated Audit &bull; No Subscription Needed
            </span>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Instant Cadastral Audit
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    7.5% VAT Included
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <h3 className="text-3xl font-extrabold font-heading text-slate-900">
                    {formatPrice(48375)}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">/ property</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Base: {formatPrice(45000)} &bull; 7.5% Statutory VAT: {formatPrice(3375)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Single property automated deep-scan, beacon coordinates cross-check &amp; acquisition risk scorecard
                </p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Instant LandIntel 15-Section Audit</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Beacon &amp; Boundary Discrepancy Matrix</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cross-Document Conflict Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated Acquisition Verdict (Buy / Don&apos;t Buy)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Surveyor &amp; Lawyer Inquiry Checklists</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Publication-Grade Certified PDF Download</span>
                </li>
              </ul>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleInitiateOneOffPackage("STANDARD_AUDIT")}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer py-3"
            >
              <span>Unlock Single Property Audit ({formatPrice(48375)})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Available Plans Selector */}
      <div id="plans" className="space-y-4 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 font-heading">Available Subscription Tiers</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                7.5% VAT Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory 7.5% Value Added Tax (VAT) is applied in accordance with tax laws. Select your preferred currency and view transparent itemized costs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* VAT Display Toggle */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setIncludeVat(true)}
                className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                  includeVat ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Incl. 7.5% VAT
              </button>
              <button
                type="button"
                onClick={() => setIncludeVat(false)}
                className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                  !includeVat ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Excl. VAT
              </button>
            </div>

            {/* Currency Pill Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(["NGN", "USD", "GBP", "EUR", "CAD"] as SupportedCurrency[]).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setCurrency(cKey)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    currency === cKey ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cKey}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VAT Tax Regulatory Notice */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>
              <strong>Statutory Value Added Tax Notice:</strong> All subscriptions and due-diligence report fees include <strong>7.5% statutory VAT</strong>. Official Tax Receipts & Invoices are issued immediately upon confirmation.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 hidden sm:inline">
            FIRS / Statutory Rate: 7.5%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans
            .filter((p) => p.key !== "FREE")
            .map((plan) => {
              const isCurrent = currentPlanKey === plan.key;
              const baseNgn = plan.priceNgn;
              const baseUsd = plan.priceUsd ?? Math.round(plan.priceNgn / 1500);
              const vatNgn = Math.round(baseNgn * 0.075);
              const totalNgn = baseNgn + vatNgn;

              // Currency conversions
              const cfg = CURRENCIES[currency] || CURRENCIES.NGN;
              const rate = liveRates[currency] || cfg.rateToNgn || 1;

              let baseDisplay: string;
              let vatDisplay: string;
              let totalDisplay: string;

              if (currency === "NGN") {
                baseDisplay = `₦${baseNgn.toLocaleString()}`;
                vatDisplay = `₦${vatNgn.toLocaleString()}`;
                totalDisplay = `₦${totalNgn.toLocaleString()}`;
              } else if (currency === "USD") {
                const vatUsd = Number((baseUsd * 0.075).toFixed(2));
                const totalUsd = Number((baseUsd + vatUsd).toFixed(2));
                baseDisplay = `$${baseUsd.toLocaleString()}`;
                vatDisplay = `$${vatUsd.toFixed(2)}`;
                totalDisplay = `$${totalUsd.toLocaleString()}`;
              } else {
                const convertedBase = Math.round(baseNgn / rate);
                const convertedVat = Math.round(vatNgn / rate);
                const convertedTotal = convertedBase + convertedVat;
                baseDisplay = `${cfg.symbol}${convertedBase.toLocaleString()}`;
                vatDisplay = `${cfg.symbol}${convertedVat.toLocaleString()}`;
                totalDisplay = `${cfg.symbol}${convertedTotal.toLocaleString()}`;
              }

              const headlinePrice = includeVat ? totalDisplay : baseDisplay;

              return (
                <div
                  key={plan.key}
                  className={`bg-white rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all shadow-sm ${
                    isCurrent
                      ? "border-emerald-600 ring-2 ring-emerald-600/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-800">{plan.name}</span>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Current
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {plan.key}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                          {headlinePrice}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Package Pass
                        </span>
                      </div>
                      <div className="mt-1">
                        {includeVat ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            ✓ Incl. 7.5% Statutory VAT
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            + 7.5% VAT at checkout
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Itemized Tax Breakdown Card */}
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Base Subscription:</span>
                        <span className="font-bold text-slate-800">{baseDisplay}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Statutory VAT (7.5%):</span>
                        <span className="font-bold text-emerald-700">+{vatDisplay}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-extrabold border-t border-slate-200 pt-1 text-xs">
                        <span>Total Payable:</span>
                        <span className="text-emerald-800">{totalDisplay}</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Up to {plan.maxActiveCases} active cases</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{plan.maxDocumentsPerCase} documents per case</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{plan.maxAiQuestionsPerCase} AI inquiries / case</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Certified publication-grade PDF</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Instant FIRS-Compliant VAT Receipt</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <Button
                      variant={isCurrent ? "outline" : "primary"}
                      size="sm"
                      className="w-full font-bold text-xs"
                      disabled={isCurrent || actionLoading === `upgrade_${plan.key}`}
                      onClick={() => handleUpgradePlan(plan.key)}
                    >
                      {isCurrent
                        ? "Active Tier"
                        : actionLoading === `upgrade_${plan.key}`
                        ? "Processing..."
                        : `Select ${plan.key}`}
                    </Button>
                    {!isCurrent && (
                      <p className="text-[10px] text-center text-slate-400">
                        Total {totalDisplay}/mo (inclusive of 7.5% VAT)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Payment History & Receipts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payment History & Tax Receipts</h2>
            <p className="text-xs text-slate-500">
              Immutable ledger of all purchases with statutory 7.5% VAT itemization and downloadable receipts.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
            <Receipt className="w-3.5 h-3.5" />
            <span>Official Tax Documentation Included</span>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No transactions found. All future payment receipts with 7.5% VAT breakdown will be recorded here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Subtotal</th>
                  <th className="py-2.5 px-3">VAT (7.5%)</th>
                  <th className="py-2.5 px-3">Total Paid</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Tax Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {payments.map((p) => {
                  let meta: any = {};
                  try {
                    meta = typeof p.metadata === "string" ? JSON.parse(p.metadata) : p.metadata || {};
                  } catch (e) {}

                  const total = p.amount || 0;
                  const subtotal = meta.subtotal || Math.round(total / 1.075);
                  const vatAmount = meta.vatAmount || (total - subtotal);
                  
                  // Accurate currency resolution preventing symbol/code mismatch
                  const isUsd = (p.currency || "").toUpperCase() === "USD";
                  const isGbp = (p.currency || "").toUpperCase() === "GBP";
                  const isEur = (p.currency || "").toUpperCase() === "EUR" && total < 5000;
                  const sym = isUsd ? "$" : isGbp ? "£" : isEur ? "€" : "₦";
                  const currCode = isUsd ? "USD" : isGbp ? "GBP" : isEur ? "EUR" : "NGN";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{p.reference}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        {p.caseTitle || meta.description || meta.packageName || "Plan Subscription"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">
                        {sym}{subtotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-sans font-medium">
                        +{sym}{vatAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">
                        {sym}{total.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{p.provider}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === "SUCCESSFUL"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt({ ...p, subtotal, vatAmount, total, currencySymbol: sym, resolvedCurrency: currCode })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-bold transition-all border border-slate-200 hover:border-emerald-300"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Receipt & Invoice Modal with Professional Print Engine */}
      {selectedReceipt && (
        <>
          <style jsx global>{`
            @media print {
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-vat-receipt,
              #printable-vat-receipt * {
                visibility: visible !important;
              }
              #printable-vat-receipt {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 32px !important;
                background: #ffffff !important;
                color: #0f172a !important;
                border: 2px solid #0f172a !important;
                border-radius: 12px !important;
                box-shadow: none !important;
                z-index: 999999 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div id="printable-vat-receipt" className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between no-print">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-heading font-extrabold text-base">Official VAT Tax Receipt</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedReceipt.reference}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-5">
                {/* Corporate Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 font-black text-sm">
                        LI
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base font-heading leading-tight">
                          LandIntel Cadastral Intelligence Ltd.
                        </h4>
                        <p className="text-xs text-slate-500">Statutory Land Due-Diligence & Boundary Verification</p>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2.5 space-y-0.5 font-sans">
                      <p><span className="font-semibold text-slate-700">TIN / VAT Reg:</span> 24198273-0001 (FIRS Registered)</p>
                      <p><span className="font-semibold text-slate-700">RC No:</span> 1984291 • Statutory Tax Compliant</p>
                      <p className="text-slate-400">Victoria Island, Lagos, Nigeria • Diaspora Desk: London / New York</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      PAID IN FULL
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">ELECTRONIC RECEIPT</p>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Issue Date</span>
                    <span className="font-bold text-slate-800">
                      {new Date(selectedReceipt.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Gateway</span>
                    <span className="font-bold text-slate-800 font-mono uppercase">{selectedReceipt.provider || "PAYSTACK"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Transaction Ref</span>
                    <span className="font-mono text-slate-800 truncate block text-[11px] font-medium" title={selectedReceipt.reference}>
                      {selectedReceipt.reference}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Tax Category</span>
                    <span className="font-semibold text-emerald-800">Standard 7.5% VAT</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-mono border-b border-slate-200">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Tax Rate</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 text-slate-800">
                          <span className="font-bold block text-xs">
                            {selectedReceipt.caseTitle || selectedReceipt.metadata?.description || selectedReceipt.metadata?.packageName || "LandIntel Cadastral Due-Diligence Report"}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Institutional land search, boundary verification & cadastral risk audit
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          Excl. VAT
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {selectedReceipt.currencySymbol || "₦"}{selectedReceipt.subtotal?.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/50">
                        <td className="p-3 text-emerald-900 font-medium">
                          Statutory Value Added Tax (VAT 7.5%)
                          <span className="text-[10px] text-emerald-700 block font-normal">
                            FIRS Value Added Tax Act Section 34
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-800">
                          7.5%
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800">
                          +{selectedReceipt.currencySymbol || "₦"}{selectedReceipt.vatAmount?.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-bold">
                      <tr>
                        <td className="p-3 text-xs" colSpan={2}>
                          Total Amount Paid ({selectedReceipt.resolvedCurrency || "NGN"})
                        </td>
                        <td className="p-3 text-right font-mono text-base text-emerald-400">
                          {selectedReceipt.currencySymbol || "₦"}{selectedReceipt.total?.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Statutory Compliance Footer */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Authenticated Statutory Electronic VAT Invoice & Tax Clearance Record</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Auth: {selectedReceipt.reference?.slice(-10)}
                    </span>
                  </div>

                  {/* Action Buttons (Hidden during print) */}
                  <div className="flex justify-end items-center gap-2 pt-2 no-print">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReceipt(null)}
                      className="font-medium text-xs"
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.print()}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Official Receipt</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Property Selector Modal if multiple properties */}
      {propertySelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-heading font-extrabold text-base">Select Property Case</h3>
                  <p className="text-[11px] text-slate-400">
                    Choose which property to apply the Instant Cadastral Audit Report to:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPropertySelectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {properties.map((prop) => (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => handleSelectPropertyForCheckout(prop)}
                  className="w-full p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-amber-800">
                      {prop.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {prop.lga}, {prop.state} &bull; {prop.documents?.length || 0} documents
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-600 group-hover:text-amber-700 flex items-center gap-1">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Link href={`/properties/new?package=${checkoutPackageType}`}>
                  <Button variant="outline" size="sm" className="text-xs font-bold">
                    + Add New Property Case Instead
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Checkout Modal */}
      {selectedPropertyForCheckout && (
        <ReportCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            setSelectedPropertyForCheckout(null);
          }}
          caseId={selectedPropertyForCheckout.id}
          propertyTitle={selectedPropertyForCheckout.title}
          initialPackageType={checkoutPackageType}
          onSuccess={async () => {
            setFeedback({ type: "success", message: `Certified report unlocked successfully!` });
            await fetchBillingData(true);
          }}
        />
      )}
    </div>
  );
}
