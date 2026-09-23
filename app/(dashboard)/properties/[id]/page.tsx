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

export default function PropertyCaseHubPage() {
  const { formatPrice } = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const caseId = params.id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "findings" | "verification" | "report">("overview");
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
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: "user" | "ai"; text: string; evidence?: string; action?: string }>>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);

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

  const handleSendAssistant = async (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault();
    const query = (directPrompt || assistantInput).trim();
    if (!query || assistantLoading) return;

    setAssistantInput("");
    setAssistantMessages((prev) => [...prev, { sender: "user", text: query }]);
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
            sender: "ai",
            text: data.response.answer,
            evidence: data.response.evidence,
            action: data.response.recommendedAction,
          },
        ]);
      } else {
        setAssistantMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Unable to process query based on case documents." },
        ]);
      }
    } catch {
      setAssistantMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Network error connecting to Case Assistant." },
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const recommendation = propertyCase?.riskScore
    ? getPurchaseRecommendation(propertyCase.riskScore.score, propertyCase.riskScore.level, {
        isSynthetic:
          (propertyCase.riskScore.explanation || "").toLowerCase().includes("synthetic") ||
          (propertyCase.riskScore.explanation || "").toLowerCase().includes("placeholder"),
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
            <a
              href={`/api/properties/${caseId}/report/pdf`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold rounded-button shadow-subtle transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
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
                <span>Unlock Certified Report ({formatPrice(48375)})</span>
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
          { id: "report", label: "Report & AI Assistant" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "border-brand-blue text-brand-blue font-bold"
                : "border-transparent text-brand-textSecondary hover:text-brand-textPrimary"
            }`}
          >
            <span>{tab.label}</span>
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
              {propertyCase.latitude && propertyCase.longitude && (
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  {Number(propertyCase.latitude).toFixed(4)}, {Number(propertyCase.longitude).toFixed(4)}
                </span>
              )}
            </CardHeader>
            <div className="p-4 sm:p-6 pt-0">
              <PropertyMap
                center={
                  propertyCase.latitude && propertyCase.longitude
                    ? { lat: Number(propertyCase.latitude), lng: Number(propertyCase.longitude) }
                    : undefined
                }
                coordinates={[]}
                height="380px"
                showSatellite={true}
                locationFound={propertyCase.locationFound !== false && Boolean(propertyCase.latitude && propertyCase.longitude)}
                address={`${propertyCase.address}, ${propertyCase.lga}, ${propertyCase.state}`}
                occupancyStatus={propertyCase.occupancyStatus || (propertyCase.propertyType === "LAND" ? "BARE" : "OCCUPIED")}
              />
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Toggle Satellite / Map in control bar to inspect ground occupancy and structures
                </span>
                <Link
                  href={`/properties/${caseId}/analysis`}
                  className="text-brand-blue font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  View Full Cadastral Report <ArrowRight className="w-3.5 h-3.5" />
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
                Unlock Full Report ({formatPrice(48375)} incl. VAT)
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
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isComplete
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
                      </div>
                      <p className="text-xs text-brand-textSecondary">{item.description}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <button
                        onClick={() => handleChecklistToggle(item.id, item.status)}
                        className={`px-3 py-1.5 rounded-button text-xs font-bold border transition-colors cursor-pointer ${
                          isComplete
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

      {/* TAB 5: REPORT & ASSISTANT */}
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
                        <span>Unlock Certified Report ({formatPrice(48375)})</span>
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
                              <h4 className="text-2xl font-black font-heading text-slate-900">{formatPrice(48375)}</h4>
                              <span className="text-xs text-slate-500">/ property</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Base: {formatPrice(45000)} &bull; 7.5% Statutory VAT: {formatPrice(3375)}
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
                          <span>Unlock Report for this Property ({formatPrice(48375)})</span>
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
                      "Is this land safe to buy or pay deposit?",
                      "What do the survey beacons mean?",
                      "What does 'Excision in Progress' mean?",
                      "What should my lawyer search at Lands Registry?",
                      "What should the surveyor chart?",
                      "Which documents conflict?",
                    ].map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => handleSendAssistant(undefined, promptText)}
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
                    <p>{msg.text}</p>
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
                  placeholder="Ask a question about this property..."
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
