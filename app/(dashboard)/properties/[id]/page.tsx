"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Upload,
  Bot,
  Lock,
  Download,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Send,
  HelpCircle,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Scale,
  Video,
  Compass,
  Award,
  Play,
  Check,
  Clock,
  Sparkles,
  Copy,
  MessageSquare,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RiskScoreMeter } from "@/components/ui/RiskScoreMeter";
import { useToast } from "@/components/ui/Toast";
import { APP_CONFIG } from "@/lib/config";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ReportCheckoutModal } from "@/components/payments/ReportCheckoutModal";
import { getPurchaseRecommendation } from "@/lib/ai/types";
import { ONE_OFF_PACKAGES, OneOffPackageKey } from "@/lib/services/plans";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(
  () => import("@/components/maps/PropertyMap").then((mod) => ({ default: mod.PropertyMap })),
  { ssr: false, loading: () => <div className="h-[380px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">Loading satellite view...</div> }
);

function renderBoldSpans(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function formatAssistantMessage(text: string) {
  return text.split("\n\n").map((para, pIdx) => {
    const lines = para.split("\n");
    if (lines.length > 1 && lines.some((l) => l.trim().startsWith("•") || l.trim().startsWith("-") || /^\d+\./.test(l.trim()))) {
      return (
        <ul key={pIdx} className="space-y-1.5 my-1.5 list-disc list-inside">
          {lines.map((line, lIdx) => {
            const cleanLine = line.replace(/^[•\-\*]\s*/, "").replace(/^\d+\.\s*/, "");
            return (
              <li key={lIdx} className="text-xs text-slate-800 leading-relaxed">
                {renderBoldSpans(cleanLine)}
              </li>
            );
          })}
        </ul>
      );
    }
    return (
      <p key={pIdx} className="text-xs text-slate-800 leading-relaxed my-1">
        {renderBoldSpans(para)}
      </p>
    );
  });
}

export default function PropertyCaseHubPage() {
  const { formatPrice } = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const caseId = params.id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "findings" | "verification" | "assistant" | "report">("overview");
  const [propertyCase, setPropertyCase] = useState<any | null>(null);
  const [isReportUnlocked, setIsReportUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckoutPackage, setSelectedCheckoutPackage] = useState<OneOffPackageKey>("STANDARD_AUDIT");

  // Document upload state
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("SURVEY_PLAN");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assistant state
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<
    Array<{
      id: string;
      sender: "user" | "ai";
      text: string;
      evidence?: string;
      action?: string;
      timestamp: string;
    }>
  >([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Payment unlock state
  const [unlockingPayment, setUnlockingPayment] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const fetchCase = async () => {
    try {
      const res = await fetch(`/api/properties/${caseId}`);
      if (!res.ok) {
        toast("Failed to load property case", "error");
        router.push("/properties");
        return;
      }
      const data = await res.json();
      setPropertyCase(data.propertyCase);
      setIsReportUnlocked(data.isReportUnlocked);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast("Error loading case", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();

    // Check payment callback
    if (searchParams?.get("payment") === "success") {
      toast("Payment confirmed! Full due-diligence report is now unlocked.", "success");
      setActiveTab("report");
    } else if (searchParams?.get("payment") === "verify" && searchParams?.get("ref")) {
      const ref = searchParams?.get("ref");
      fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            toast("Payment verified successfully! Report unlocked.", "success");
            fetchCase();
            setActiveTab("report");
          }
        });
    }
  }, [caseId, searchParams]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", selectedCategory);

    try {
      const res = await fetch(`/api/properties/${caseId}/documents`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Upload failed", "error");
      } else {
        toast(`Uploaded "${file.name}" and initiated intelligence extraction.`, "success");
        await fetchCase();
      }
    } catch (err) {
      toast("Network error during upload", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    toast("Re-evaluating cross-document cadastral heuristics...", "info");
    try {
      const res = await fetch(`/api/properties/${caseId}/analyze`, { method: "POST" });
      if (res.ok) {
        toast("Analysis complete!", "success");
        await fetchCase();
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Re-analysis failed", "error");
      }
    } catch {
      toast("Re-analysis failed", "error");
    } finally {
      setReanalyzing(false);
    }
  };

  const handleUnlockReport = (pkg?: OneOffPackageKey | React.MouseEvent) => {
    if (isReportUnlocked) {
      toast("Report is already unlocked!", "info");
      return;
    }
    const packageKey: OneOffPackageKey = typeof pkg === "string" ? pkg : "STANDARD_AUDIT";
    setSelectedCheckoutPackage(packageKey);
    setCheckoutModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setIsReportUnlocked(true);
    toast("Payment confirmed! Full 15-section report is now unlocked.", "success");
    await fetchCase();
    setActiveTab("report");
  };

  const handleChecklistToggle = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETE" ? "PENDING" : currentStatus === "PENDING" ? "NEEDS_REVIEW" : "COMPLETE";
    try {
      const res = await fetch(`/api/properties/${caseId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status: nextStatus }),
      });
      if (res.ok) {
        await fetchCase();
        toast("Checklist updated", "info");
      }
    } catch {
      toast("Failed to update item", "error");
    }
  };

  useEffect(() => {
    if (propertyCase && assistantMessages.length === 0) {
      setAssistantMessages([
        {
          id: "welcome-ai",
          sender: "ai",
          text: `Welcome to the LandIntel Legal & Cadastral AI Counsel for "${propertyCase.title}".\n\nI have evaluated the ${propertyCase.documents.length} document(s) in this case file, the cross-document reconciliation matrix, and the current cadastral risk score (${propertyCase.riskScore?.score ?? "N/A"}/100, ${propertyCase.riskScore?.level ?? "PENDING"}).\n\nI am grounded strictly in this property's actual uploaded instruments, extracted beacon numbers, SURCON surveying standards, and statutory Nigerian conveyancing law. You can click any suggested inquiry below or ask anything directly!`,
          evidence: `Case Dossier: ${propertyCase.title} | ${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state}.`,
          action: "Select a suggested topic below or type an inquiry about this property.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [propertyCase]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [assistantMessages, assistantLoading]);

  const handleSendAssistant = async (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault();
    const query = (directPrompt || assistantInput).trim();
    if (!query || assistantLoading) return;

    setAssistantInput("");
    setAssistantError(null);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}`;
    setAssistantMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: query, timestamp: now }]);
    setAssistantLoading(true);

    try {
      const res = await fetch(`/api/properties/${caseId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();

      if (res.ok && data.response) {
        setAssistantMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: data.response.answer,
            evidence: data.response.evidence,
            action: data.response.recommendedAction,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else if (res.status === 403 && data.code === "QUOTA_EXCEEDED") {
        setAssistantError(data.error);
        setAssistantMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "ai",
            text: `⚠️ **AI Question Quota Exceeded**: ${data.error}`,
            action: "Unlock Full Certified Report to get unlimited AI Assistant inquiries.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        setAssistantMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "ai",
            text: data.error || "Unable to process query based on case documents. Please try rephrasing.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setAssistantMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          text: "Network error connecting to Case Assistant. Please check your internet connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleClearAssistant = () => {
    setAssistantMessages([
      {
        id: "cleared-welcome",
        sender: "ai",
        text: `Conversation reset. I am ready to answer any due-diligence questions regarding "${propertyCase.title}".`,
        evidence: `Case: ${propertyCase.title} | ${propertyCase.documents.length} document(s) indexed.`,
        action: "Select a topic or type a new inquiry below.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setAssistantError(null);
  };

  const recommendation = propertyCase?.riskScore
    ? getPurchaseRecommendation(propertyCase.riskScore.score, propertyCase.riskScore.level, {
        isSynthetic:
          (propertyCase.riskScore.explanation || "").toLowerCase().includes("synthetic") ||
          (propertyCase.riskScore.explanation || "").toLowerCase().includes("placeholder") ||
          (propertyCase.riskScore.explanation || "").toLowerCase().includes("non-cadastral") ||
          (propertyCase.riskScore.explanation || "").toLowerCase().includes("unverified"),
        criticalFindingsCount: propertyCase.findings.filter((f: any) => f.severity === "CRITICAL").length,
      })
    : null;

  if (loading || !propertyCase) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-brand-blue animate-spin" />
          <span className="text-xs text-brand-textSecondary">Loading case intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Properties</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-brand-textPrimary truncate max-w-xs">{propertyCase.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReanalyze} isLoading={reanalyzing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${reanalyzing ? "animate-spin" : ""}`} />
            <span>Refresh Analysis</span>
          </Button>

          {isReportUnlocked ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/verify/${caseId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-button shadow-2xs transition-all cursor-pointer"
                title="View Cryptographic Certificate of Authenticity"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verify Certificate</span>
              </Link>
              <a
                href={`/api/properties/${caseId}/report/pdf`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold rounded-button shadow-subtle transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUnlockReport("STANDARD_AUDIT")}
                isLoading={unlockingPayment}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                <span>Unlock Certified Report ({formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.totalPriceNgn)})</span>
              </Button>
              <Link
                href="/billing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>Subscription Plans</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Property Hero Banner */}
      <div className="bg-white border border-brand-border rounded-card p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <StatusBadge status={propertyCase.status} />
            {isReportUnlocked ? (
              <span className="px-2.5 py-0.5 rounded-pill text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-blue-600" />
                REPORT UNLOCKED
              </span>
            ) : null}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-textPrimary font-heading tracking-tight">
            {propertyCase.title}
          </h1>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-brand-textSecondary">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {propertyCase.address}, {propertyCase.lga}, {propertyCase.state}, {propertyCase.country || ""}
            </span>
            <span>•</span>
            <span>Type: <strong className="text-brand-textPrimary font-semibold">{propertyCase.propertyType}</strong></span>
            {propertyCase.purchasePrice && (
              <>
                <span>•</span>
                <span>Price: <strong className="text-brand-textPrimary font-semibold">{propertyCase.currency || "NGN"} {propertyCase.purchasePrice.toLocaleString()}</strong></span>
              </>
            )}
          </div>
        </div>

        {propertyCase.riskScore && (
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            <RiskBadge level={propertyCase.riskScore.level} />
            {recommendation && (
              <span
                className={`px-3 py-1 rounded-pill text-xs font-black tracking-wide border shadow-2xs ${recommendation.badgeBg} ${recommendation.badgeText} ${recommendation.badgeBorder}`}
              >
                {recommendation.shortVerdict}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-brand-border flex overflow-x-auto gap-2 text-xs font-semibold">
        {[
          { id: "overview", label: "Overview" },
          { id: "documents", label: `Documents (${propertyCase.documents.length})` },
          { id: "findings", label: `Findings (${propertyCase.findings.length})` },
          { id: "verification", label: "Checklist" },
          { id: "assistant", label: "Case AI Assistant", isAi: true },
          { id: "report", label: "15-Section Report" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "border-brand-blue text-brand-blue font-bold bg-brand-blue/5 rounded-t-lg"
                : "border-transparent text-brand-textSecondary hover:text-brand-textPrimary"
            }`}
          >
            {tab.isAi && <Bot className={`w-3.5 h-3.5 ${activeTab === "assistant" ? "text-brand-blue" : "text-emerald-600"}`} />}
            <span>{tab.label}</span>
            {tab.isAi && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI Counsel
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {propertyCase.riskScore ? (
            <RiskScoreMeter
              score={propertyCase.riskScore.score}
              level={propertyCase.riskScore.level}
              explanation={propertyCase.riskScore.explanation}
              breakdown={{
                documentationScore: propertyCase.riskScore.documentationScore,
                ownershipScore: propertyCase.riskScore.ownershipScore,
                geographicScore: propertyCase.riskScore.geographicScore,
                consistencyScore: propertyCase.riskScore.consistencyScore,
              }}
            />
          ) : (
            <Card>
              <div className="text-center py-6">
                <p className="text-xs text-brand-textSecondary">Upload documents to generate a Risk Indicator Score.</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Identified Concerns</CardTitle>
                <CardDescription>Primary issues flagged from cross-document comparison</CardDescription>
              </CardHeader>
              <div className="space-y-3">
                {(propertyCase.findings || []).slice(0, 3).map((f: any) => (
                  <div key={f.id} className="p-3 rounded-lg border border-brand-border bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-brand-textPrimary">{f.title}</span>
                      <RiskBadge level={f.severity} showIcon={false} />
                    </div>
                    <p className="text-xs text-brand-textSecondary leading-relaxed">{f.description}</p>
                  </div>
                ))}
                {propertyCase.findings.length === 0 && (
                  <p className="text-xs text-brand-textMuted py-4 text-center">No risk indicators recorded yet.</p>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction & Cadastral Profile</CardTitle>
                <CardDescription>Verified records and submitted particulars</CardDescription>
              </CardHeader>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-brand-textSecondary">Disclosed Seller:</dt>
                  <dd className="font-semibold text-brand-textPrimary">{propertyCase.sellerName || "Not Disclosed"}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-brand-textSecondary">Real Estate Agent:</dt>
                  <dd className="font-semibold text-brand-textPrimary">{propertyCase.agentName || "Direct Vendor"}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-brand-textSecondary">Submitted Documents:</dt>
                  <dd className="font-semibold text-brand-textPrimary">{propertyCase.documents.length} File(s)</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-brand-textSecondary">GPS Coordinates:</dt>
                  <dd className="font-semibold text-brand-textPrimary font-mono">
                    {propertyCase.latitude && propertyCase.longitude
                      ? `${propertyCase.latitude}, ${propertyCase.longitude}`
                      : "Coordinates not supplied"}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>

          {/* Quick AI Assistant Gateway */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-brand-darkNavy text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-brand-blue/20 text-sky-400 border border-brand-blue/30 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-heading">Consult LandIntel AI Assistant</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/40">Grounded AI Counsel</span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  Ask immediate questions about surveyor beacons, root of title (C of O / Governor&apos;s Consent), statutory setbacks, or whether this property is safe to purchase.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab("assistant")}
              className="shrink-0 bg-brand-blue hover:bg-brand-blueHover text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              <span>Launch AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Satellite Property Reconnaissance Map */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="w-4 h-4 text-brand-blue" />
                  Satellite & Boundary Ground Reconnaissance
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  High-resolution aerial satellite imagery to inspect parcel occupancy, physical structures, vegetation, and surrounding infrastructure.
                </CardDescription>
              </div>
              {propertyCase.latitude && propertyCase.longitude && propertyCase.locationFound !== false ? (
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {Number(propertyCase.latitude).toFixed(4)}, {Number(propertyCase.longitude).toFixed(4)}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  Location Unverified
                </span>
              )}
            </CardHeader>
            <div className="p-4 sm:p-6 pt-0">
              <PropertyMap
                center={
                  propertyCase.latitude && propertyCase.longitude && propertyCase.locationFound !== false
                    ? { lat: Number(propertyCase.latitude), lng: Number(propertyCase.longitude) }
                    : undefined
                }
                coordinates={[]}
                height="380px"
                showSatellite={true}
                locationFound={propertyCase.locationFound !== false && Boolean(propertyCase.latitude && propertyCase.longitude)}
                address={`${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state}`}
                occupancyStatus={propertyCase.occupancyStatus || (propertyCase.propertyType === "LAND" ? "BARE" : "OCCUPIED")}
                isLocked={!propertyCase.isMapUnlocked && !isReportUnlocked}
                onUnlock={() => {
                  setSelectedCheckoutPackage("STANDARD_AUDIT");
                  setCheckoutModalOpen(true);
                }}
              />
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {!propertyCase.isMapUnlocked && !isReportUnlocked ? (
                  <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Cadastral Reconnaissance &amp; Overlay Preview Locked</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
                    <span>Toggle Satellite / Map in control bar to inspect ground occupancy and structures</span>
                  </span>
                )}
                <Link
                  href={`/properties/${caseId}/analysis`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-blue/10 text-brand-blue font-bold text-xs transition-all self-start sm:self-auto cursor-pointer border border-slate-200 hover:border-brand-blue/30"
                >
                  <span>View Full Cadastral Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Property Documents</CardTitle>
              <CardDescription>
                Upload scanned Survey Plans, Deeds of Assignment, Occupancy Certificates, Gazette Excision, or Receipts. Documents are stored privately and encrypted.
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                  Document Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-brand-border rounded-input bg-white"
                >
                  {APP_CONFIG.documentCategories.map((dc) => (
                    <option key={dc.id} value={dc.id}>{dc.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  className="hidden"
                />
                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span>{uploading ? "Processing Document Pipeline..." : "Select File (PDF, PNG, JPG, DOCX)"}</span>
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-brand-textMuted leading-relaxed">
              Files are processed in an isolated environment. Text extraction and cadastral entity mapping happen automatically upon upload.
            </p>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-textPrimary font-heading">
              Submitted Documents ({propertyCase.documents.length})
            </h3>

            {propertyCase.documents.length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed border-brand-border rounded-card">
                <p className="text-xs text-brand-textSecondary">No documents submitted yet. Upload a Survey Plan or Deed above to run cross-document analysis.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {(propertyCase.documents || []).map((doc: any) => (
                  <div key={doc.id} className="bg-white border border-brand-border rounded-card p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-textPrimary">{doc.originalName}</span>
                        <span className="px-2 py-0.5 rounded-pill text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {doc.category}
                        </span>
                        <StatusBadge status={doc.processingStatus} />
                      </div>
                      <p className="text-xs text-brand-textSecondary">{doc.extractedSummary || "OCR extraction complete."}</p>
                      
                      {doc.extractions && doc.extractions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {(doc.extractions || []).map((e: any) => (
                            <span key={e.id} className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono">
                              <strong>{e.fieldName}:</strong> {e.fieldValue} (Pg {e.pageNumber})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-button transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FINDINGS */}
      {activeTab === "findings" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-brand-textPrimary font-heading">
                Due-Diligence Findings & Risk Indicators
              </h2>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                Every finding is grounded in submitted document evidence and cadastral comparisons.
              </p>
            </div>
            {!isReportUnlocked && (
              <span className="px-2.5 py-1 rounded-pill text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Free Preview Mode</span>
              </span>
            )}
          </div>

          {!isReportUnlocked && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Detailed Evidence References Locked
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed max-w-xl">
                  Unlock the Full Due-Diligence Report to view exact supporting document page citations, beacon reference numbers, and complete recommended action playbooks.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleUnlockReport} isLoading={unlockingPayment} className="shrink-0">
                Unlock Full Report ({formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.totalPriceNgn)} incl. VAT)
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {(propertyCase.findings || []).map((f: any) => (
              <div key={f.id} className="bg-white border border-brand-border rounded-card p-5 shadow-subtle space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-border">
                  <div>
                    <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider block">
                      {f.category} INDICATOR
                    </span>
                    <h3 className="text-sm font-bold text-brand-textPrimary font-heading mt-0.5">{f.title}</h3>
                  </div>
                  <RiskBadge level={f.severity} />
                </div>

                <p className="text-xs text-brand-textPrimary leading-relaxed">{f.description}</p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-brand-textPrimary block mb-0.5">Evidence Provenance:</span>
                    <p className="text-brand-textSecondary">{f.evidenceSummary}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-brand-textPrimary block mb-0.5">Why It Matters:</span>
                    <p className="text-brand-textSecondary">{f.whyItMatters}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-brand-textPrimary block mb-0.5">Recommended Action:</span>
                    <p className="text-brand-textSecondary">{f.recommendedAction}</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-brand-textMuted">
                  <span>Citations: {f.pageReferences}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VERIFICATION CHECKLIST */}
      {activeTab === "verification" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cadastral & Legal Due-Diligence Checklist</CardTitle>
              <CardDescription>
                11 essential due-diligence milestones. Items marked &quot;Professional Required&quot; require an independent surveyor or property lawyer.
              </CardDescription>
            </CardHeader>

            <div className="space-y-3">
              {(propertyCase.verificationItems || []).map((item: any) => {
                const isComplete = item.status === "COMPLETE";
                const isReview = item.status === "NEEDS_REVIEW";
                const isFailed = item.status === "FAILED";
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isFailed
                        ? "bg-rose-50/60 border-rose-300"
                        : isComplete
                        ? "bg-emerald-50/40 border-emerald-200"
                        : isReview
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-white border-brand-border"
                    }`}
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-textPrimary">{item.title}</span>
                        {item.requiresProfessional && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            Professional Required
                          </span>
                        )}
                        {isFailed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            DEFECT DETECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-textSecondary">{item.description}</p>
                      {item.notes && (
                        <p className={`text-[11px] font-medium ${isFailed ? "text-rose-700 font-semibold" : "text-brand-textMuted"}`}>
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <button
                        onClick={() => handleChecklistToggle(item.id, item.status)}
                        className={`px-3 py-1.5 rounded-button text-xs font-bold border transition-colors cursor-pointer ${
                          isFailed
                            ? "bg-rose-600 text-white border-rose-700 hover:bg-rose-700"
                            : isComplete
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : isReview
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {item.status}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB: CASE AI ASSISTANT (DEDICATED FULL-SCALE COUNSEL) */}
      {activeTab === "assistant" && (
        <div className="space-y-6">
          {/* Header Card with Case Context */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-brand-darkNavy text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  LandIntel Legal &amp; Cadastral AI Counsel
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {propertyCase.documents.length} Document(s) Indexed &bull; SURCON Standards &bull; Land Use Act 1978
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                AI Due-Diligence Counsel for {propertyCase.title}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Direct, grounded legal and survey answers synthesized specifically from this property&apos;s submitted instruments, beacon coordinates, and statutory Nigerian conveyancing jurisprudence.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-2">
              {propertyCase.riskScore && (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-right space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Risk Assessment
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-black text-white font-mono">
                      {propertyCase.riskScore.score}/100
                    </span>
                    <RiskBadge level={propertyCase.riskScore.level} showIcon={false} />
                  </div>
                </div>
              )}
              <Button
                variant="outline-dark"
                size="sm"
                onClick={handleClearAssistant}
                className="text-xs font-semibold text-slate-100 hover:text-white border-slate-700 hover:border-slate-600 bg-slate-900/90 hover:bg-slate-800 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                <span>Reset Chat</span>
              </Button>
            </div>
          </div>

          {/* Assistant Interactive Workspace */}
          <Card className="flex flex-col min-h-[640px] shadow-sm border-slate-200">
            {/* Quick Topic Chips */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                  Suggested Due-Diligence &amp; Cadastral Inquiries:
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Click any inquiry to ask immediately
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { text: "🚨 Is this land safe to buy or pay a deposit?", tag: "Safety" },
                  { text: "📍 What do the survey beacons and boundary coordinates mean?", tag: "Cadastral" },
                  { text: "📜 How do I verify the root of title and C of O?", tag: "Title" },
                  { text: "⚖️ What specific questions should my lawyer search at Lands Registry?", tag: "Legal" },
                  { text: "📐 What exact charting instructions should I give my surveyor?", tag: "Surveyor" },
                  { text: "🔍 Which uploaded documents conflict or have discrepancies?", tag: "Audit" },
                  { text: "👥 What are the rules for buying Omonile or Customary Family Land?", tag: "Customary" },
                  { text: "🏗️ Are there demolition risks, drainage canals, or road setbacks?", tag: "Setbacks" },
                  { text: "💵 Is the stated purchase consideration and valuation realistic?", tag: "Valuation" },
                  { text: "📋 What mandatory statutory documents are missing from this case?", tag: "Documents" },
                ].map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    onClick={() => handleSendAssistant(undefined, item.text)}
                    disabled={assistantLoading}
                    className="group inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white hover:bg-brand-blue/5 hover:border-brand-blue border border-slate-200 rounded-full text-slate-700 hover:text-brand-blue font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Transcript Area */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[520px] bg-white"
            >
              {assistantMessages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.sender === "user" ? (
                    <div className="max-w-xl space-y-1">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-semibold pr-1">
                        <span>You</span>
                        <span>&bull;</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className="bg-brand-blue text-white px-4 py-3 rounded-2xl rounded-tr-xs text-xs font-medium leading-relaxed shadow-sm">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-3xl space-y-2 w-full">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-1">
                        <div className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-brand-blue" />
                          <span className="font-bold text-slate-700">LandIntel AI Legal Counsel</span>
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[9px]">
                            Grounded
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.text, i)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copy answer"
                          >
                            {copiedIndex === i ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span className="text-[10px]">{copiedIndex === i ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl rounded-tl-xs p-4 sm:p-5 space-y-3.5 shadow-xs">
                        <div className="text-xs text-slate-800 leading-relaxed">
                          {formatAssistantMessage(msg.text)}
                        </div>

                        {msg.evidence && (
                          <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                            <span className="font-extrabold uppercase tracking-wider text-slate-400 text-[10px] block">
                              Cited Ground Evidence &bull; Case Record
                            </span>
                            <p className="font-mono text-slate-700 leading-relaxed">{msg.evidence}</p>
                          </div>
                        )}

                        {msg.action && (
                          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-xs text-emerald-950 flex items-start gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-extrabold uppercase tracking-wider text-emerald-900 text-[10px] block">
                                Recommended Procedural Next Step
                              </span>
                              <p className="font-semibold text-emerald-900 leading-relaxed">{msg.action}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {assistantLoading && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-md animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-blue shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">Synthesizing cadastral intelligence...</p>
                    <p className="text-[11px] text-slate-500">Evaluating case instruments, SURCON beacons, and statutory covenants.</p>
                  </div>
                </div>
              )}

              {assistantError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{assistantError}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUnlockReport("STANDARD_AUDIT")}
                    className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    <span>Unlock Full Report ({formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.totalPriceNgn)})</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl">
              <form onSubmit={handleSendAssistant} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ask a question about this property's title, beacons, vendor, zoning, or risks..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  disabled={assistantLoading}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:bg-slate-100 shadow-xs"
                />
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={assistantLoading}
                  disabled={!assistantInput.trim() || assistantLoading}
                  className="px-5 shrink-0 rounded-xl font-bold bg-brand-blue hover:bg-brand-blueHover text-white shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Ask AI Counsel</span>
                </Button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span>Press Enter to send inquiry &bull; Bounded strictly to authorized case documents</span>
                <span className="hidden sm:inline">2026 Nigerian Conveyancing &amp; Cadastral Standard</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: REPORT */}
      {activeTab === "report" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Property Due-Diligence Report</CardTitle>
                    <CardDescription>15-Section Comprehensive Certification</CardDescription>
                  </div>
                  {isReportUnlocked ? (
                    <a
                      href={`/api/properties/${caseId}/report/pdf`}
                      download
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold rounded-button shadow-subtle cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Genuine PDF</span>
                    </a>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUnlockReport("STANDARD_AUDIT")}
                        isLoading={unlockingPayment}
                        className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        <span>Unlock Certified Report ({formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.totalPriceNgn)})</span>
                      </Button>
                      <Link
                        href="/billing"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>Subscription Plans</span>
                      </Link>
                    </div>
                  )}
                </div>
              </CardHeader>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
                <div className="border-b pb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">DOCUMENT HEADER</span>
                  <h4 className="text-base font-bold font-heading text-brand-darkNavy mt-0.5">
                    LANDINTEL DUE-DILIGENCE CERTIFICATION
                  </h4>
                  <p className="text-[11px] font-medium text-brand-blue">
                    LandIntel Global — Property Due-Diligence & Cadastral Verification
                  </p>
                  <p className="text-xs text-brand-textSecondary mt-0.5">
                    Case: {propertyCase.title} | Cadastral Scope: {propertyCase.lga}, {propertyCase.state}, {propertyCase.country || "International"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-brand-textMuted block">Risk Indicator Score:</span>
                    <strong className="text-sm text-brand-textPrimary">
                      {propertyCase.riskScore?.score || 0} / 100 ({propertyCase.riskScore?.level || "N/A"})
                    </strong>
                  </div>
                  <div>
                    <span className="text-brand-textMuted block">Documents Evaluated:</span>
                    <strong className="text-sm text-brand-textPrimary">{propertyCase.documents.length} Registered</strong>
                  </div>
                </div>

                {/* Explicit Purchase Verdict: BUY OR DO NOT BUY? */}
                {recommendation && (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${recommendation.bgClass}`}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                        ACQUISITION VERDICT (BUY OR DO NOT BUY?)
                      </span>
                      <strong className={`text-base font-extrabold block ${recommendation.colorClass}`}>
                        {recommendation.headline}
                      </strong>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {recommendation.actionGuidance}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <span className={`inline-block px-3.5 py-1.5 rounded-lg text-sm font-black tracking-wider shadow-xs ${recommendation.badgeBg} ${recommendation.badgeText}`}>
                        {recommendation.shortVerdict}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t text-xs space-y-2 text-brand-textSecondary leading-relaxed">
                  <p className="font-semibold text-brand-textPrimary">Report Sections Included in Full PDF:</p>
                  <ol className="list-decimal list-inside grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                    <li>Executive Summary & Risk Index</li>
                    <li>Cadastral Property Identifiers</li>
                    <li>Document Inventory & Provenance</li>
                    <li>Cross-Document Consistency Matrix</li>
                    <li>Key Risk Indicators & Weighting</li>
                    <li>Detailed Findings & Beacon Citations</li>
                    <li>Missing or Uncertain Records</li>
                    <li>Geographic & Coordinate Boundary Checks</li>
                    <li>11-Point Statutory Verification Status</li>
                    <li>Actionable Due-Diligence Playbook</li>
                    <li>Specialized Questions for Seller</li>
                    <li>Specialized Questions for Surveyor</li>
                    <li>Specialized Questions for Property Lawyer</li>
                    <li>Scope of Evaluation Limitations</li>
                    <li>Statutory Legal Disclaimers</li>
                  </ol>
                </div>

                {!isReportUnlocked && (
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <div className="text-center max-w-xl mx-auto space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-300/60 px-2.5 py-0.5 rounded-full">
                        Statutory 7.5% VAT Included &bull; Instant Automated Delivery
                      </span>
                      <h3 className="text-lg font-black text-slate-900 font-heading">
                        Choose Your Due-Diligence Access
                      </h3>
                      <p className="text-xs text-slate-500">
                        Unlock this property case individually with an instant automated audit, or subscribe to an investor plan for continuous verifications.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Option 1: Single Property Audit */}
                      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-all">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Instant Single-Case Audit</span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              7.5% VAT Included
                            </span>
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <h4 className="text-2xl font-black font-heading text-slate-900">{formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.totalPriceNgn)}</h4>
                              <span className="text-xs text-slate-500">/ property</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Base: {formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.priceNgn)} &bull; 7.5% Statutory VAT: {formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.vatAmountNgn)}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              Automated 15-section audit, beacon matrix, boundary conflict check &amp; publication-grade PDF
                            </p>
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Instant LandIntel 15-Section Audit</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Beacon &amp; Boundary Discrepancy Matrix</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Cross-Document Conflict Analysis</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Acquisition Verdict (Buy / Do Not Buy)</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Surveyor &amp; Lawyer Inquiry Checklists</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Publication-Grade Certified PDF Download</span>
                            </li>
                          </ul>
                        </div>
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleUnlockReport("STANDARD_AUDIT")}
                          isLoading={unlockingPayment}
                          className="w-full font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                        >
                          <span>Unlock Report for this Property ({formatPrice(ONE_OFF_PACKAGES.STANDARD_AUDIT.totalPriceNgn)})</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </div>

                      {/* Option 2: Subscription Access (Professional Investor) */}
                      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-2 border-brand-blue/60 hover:border-brand-blue rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                              <span>Professional Investor Plan</span>
                            </span>
                            <span className="text-[10px] font-bold text-sky-300 bg-sky-950/90 border border-sky-500/40 px-2 py-0.5 rounded">
                              7.5% VAT Included
                            </span>
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <h4 className="text-2xl font-black font-heading text-white">{formatPrice(134375)}</h4>
                              <span className="text-xs text-slate-400">/ month</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Base: {formatPrice(125000)} &bull; 7.5% Statutory VAT: {formatPrice(9375)}
                            </p>
                            <p className="text-xs text-slate-300 mt-1">
                              Continuous automated intelligence for up to 15 active property cases every month
                            </p>
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-bold text-white">15 Active Property Cases Included</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Unlimited Document Uploads &amp; Deep OCR</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Automated Beacon Discrepancy Matrix</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Priority AI Case Assistant Questions</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Publication-Grade Certified PDF Exports</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Multi-User Team Collaboration</span>
                            </li>
                          </ul>
                        </div>
                        <Link
                          href="/billing"
                          className="w-full py-3 px-4 bg-brand-blue hover:bg-brand-blueHover text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                        >
                          <span>Subscribe to Professional Plan ({formatPrice(134375)}/mo)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* AI Case Assistant */}
          <div className="space-y-4">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-brand-blue" />
                  <div>
                    <CardTitle>Case AI Assistant</CardTitle>
                    <CardDescription>Grounded strictly in this property&apos;s records</CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto max-h-96 space-y-3 p-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-brand-textSecondary space-y-2">
                  <p className="font-semibold text-brand-textPrimary">Suggested Due-Diligence Inquiries:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "👋 Say Hello",
                      "🤖 Who are you?",
                      "🌐 What is LandIntel?",
                      "Is this land safe to buy or pay deposit?",
                      "What do the survey beacons mean?",
                      "What does 'Excision in Progress' mean?",
                      "What should my lawyer search at Lands Registry?",
                      "What should the surveyor chart?",
                      "Which documents conflict?",
                      "What packages does LandIntel offer?",
                    ].map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => handleSendAssistant(undefined, promptText.replace(/^[^\w\s]+\s*/, ""))}
                        disabled={assistantLoading}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-brand-blue/10 hover:border-brand-blue border border-brand-border rounded-full text-brand-textPrimary font-medium transition-colors text-left cursor-pointer disabled:opacity-50"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>

                {assistantMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-50 text-blue-950 border border-blue-200 ml-4 font-medium"
                        : "bg-slate-100 text-brand-textPrimary mr-4 space-y-1.5"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.evidence && (
                      <div className="pt-1 text-[11px] text-brand-textMuted border-t border-slate-200/60">
                        <strong>Evidence:</strong> {msg.evidence}
                      </div>
                    )}
                    {msg.action && (
                      <div className="text-[11px] text-brand-darkNavy font-semibold">
                        <strong>Next Step:</strong> {msg.action}
                      </div>
                    )}
                  </div>
                ))}

                {assistantLoading && (
                  <div className="flex items-center gap-2 text-xs text-brand-textMuted p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing case documents...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAssistant} className="pt-4 border-t border-brand-border flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about this property, say hello, or ask who I am..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  disabled={assistantLoading}
                  className="flex-1 px-3 py-2 text-xs border border-brand-border rounded-input bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-slate-50"
                />
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={assistantLoading}
                  disabled={!assistantInput.trim() || assistantLoading}
                  className="px-3 shrink-0"
                  aria-label="Send query"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* Diaspora Multi-Method Checkout Modal */}
      <ReportCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        caseId={caseId}
        propertyTitle={propertyCase?.title || "Property Case"}
        initialPackageType={selectedCheckoutPackage}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
