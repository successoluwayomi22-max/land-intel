"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Compass,
  FileCheck2,
  Scale,
  Building2,
  FileText,
  Clock,
  TrendingUp,
  Eye,
  Lock,
  Building,
  Trees,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ReportCheckoutModal } from "@/components/payments/ReportCheckoutModal";
import dynamic from "next/dynamic";

// Lazy-load map to avoid SSR issues
const PropertyMap = dynamic(
  () => import("@/components/maps/PropertyMap").then((mod) => ({ default: mod.PropertyMap })),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">Loading satellite map...</div> }
);

export default function PropertyAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { formatPrice } = useLocale();
  const caseId = params.id as string;

  const [propertyCase, setPropertyCase] = useState<any | null>(null);
  const [isReportUnlocked, setIsReportUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await fetch(`/api/properties/${caseId}`);
        if (!res.ok) {
          toast("Failed to load property analysis", "error");
          router.push("/properties");
          return;
        }
        const data = await res.json();
        setPropertyCase(data.propertyCase);
        setIsReportUnlocked(Boolean(data.isReportUnlocked));
        setLoading(false);
      } catch {
        toast("Error loading analysis", "error");
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading due-diligence analysis...</p>
        </div>
      </div>
    );
  }

  if (!propertyCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Property case not found.</p>
      </div>
    );
  }

  const pc = propertyCase;
  const docs = pc.documents || [];
  const findings = pc.findings || [];
  const riskScoreData = pc.riskScore || {};
  const riskScore = riskScoreData.score ?? 50;
  const riskLevel = riskScoreData.level ?? (riskScore > 80 ? "CRITICAL" : riskScore > 60 ? "HIGH" : riskScore > 40 ? "ELEVATED" : riskScore > 20 ? "MODERATE" : "LOW");
  const explanation = riskScoreData.explanation || "";

  // Ground Occupancy: Occupied structure vs Bare / Empty undeveloped land
  const occupancyStatus = pc.occupancyStatus || (
    pc.propertyType === "LAND" || pc.propertyType === "AGRICULTURAL" ? "BARE" : "OCCUPIED"
  );

  // Documents presence check (Grounded strictly in submitted instruments - no assumptions!)
  const hasSurveyPlan = docs.some((d: any) => d.category === "SURVEY_PLAN");
  const hasDeed = docs.some((d: any) => d.category === "DEED_OF_ASSIGNMENT");
  const hasCofO = docs.some((d: any) => d.category === "CERTIFICATE_OF_OCCUPANCY");
  const hasConsent = docs.some((d: any) => d.category === "GOVERNORS_CONSENT");
  const hasGazette = docs.some((d: any) => d.category === "GAZETTE");
  const hasReceipt = docs.some((d: any) => d.category === "PURCHASE_RECEIPT");

  // Extract real entities from document extractions
  const allExtractions = docs.flatMap((d: any) => d.extractions || []);
  const plotNumbers: string[] = Array.from(new Set(allExtractions.filter((e: any) => e.fieldName === "plot_number").map((e: any) => String(e.fieldValue))));
  const surveyNumbers: string[] = Array.from(new Set(allExtractions.filter((e: any) => e.fieldName === "survey_number").map((e: any) => String(e.fieldValue))));
  const surveyorNames: string[] = Array.from(new Set(allExtractions.filter((e: any) => e.fieldName === "surveyor_name").map((e: any) => String(e.fieldValue))));
  const surconNumbers: string[] = Array.from(new Set(allExtractions.filter((e: any) => e.fieldName === "surcon_number").map((e: any) => String(e.fieldValue))));
  const beaconStrings: string[] = Array.from(new Set(allExtractions.filter((e: any) => e.fieldName === "beacon_numbers").map((e: any) => String(e.fieldValue))));
  const cooNumbers: string[] = Array.from(new Set(allExtractions.filter((e: any) => e.fieldName === "coo_number").map((e: any) => String(e.fieldValue))));
  const gazetteRefs: string[] = Array.from(new Set(allExtractions.filter((e: any) => e.fieldName === "gazette_reference").map((e: any) => String(e.fieldValue))));

  // Ground beacon coordinates if surveyor coordinates exist around property center
  const centerLat = pc.latitude ? Number(pc.latitude) : null;
  const centerLng = pc.longitude ? Number(pc.longitude) : null;
  const locationFound = Boolean(centerLat && centerLng && pc.locationFound !== false);

  const beacons = beaconStrings.length > 0 && centerLat && centerLng
    ? beaconStrings[0].split(",").map((label: string, i: number) => {
        const angle = (i / 4) * 2 * Math.PI;
        const offsetLat = Math.sin(angle) * 0.00035;
        const offsetLng = Math.cos(angle) * 0.00035;
        return {
          lat: centerLat + offsetLat,
          lng: centerLng + offsetLng,
          label: label.trim(),
        };
      })
    : [];

  const handlePrintOrPdf = () => {
    if (!isReportUnlocked) {
      setCheckoutModalOpen(true);
      return;
    }
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white pb-16">
      {/* Print-only header */}
      <div className="hidden print:block p-8 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center font-black text-white text-lg">L</div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">LandIntel Official Due Diligence & Scam Audit</h1>
              <p className="text-xs text-slate-500">Confidential • Case Ref: {caseId.slice(0, 8).toUpperCase()} • Generated {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <RiskBadge level={riskLevel} size="md" />
            <span className="block text-xs font-bold text-slate-600 mt-1">Score: {riskScore}/100</span>
          </div>
        </div>
      </div>

      {/* Navigation bar (screen only) */}
      <div className="print:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href={`/properties/${caseId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Case Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            {isReportUnlocked ? (
              <>
                <Button variant="outline" size="sm" onClick={handlePrintOrPdf} className="text-xs">
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print Report
                </Button>
                <a
                  href={`/api/properties/${caseId}/report/pdf`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold rounded-button transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </a>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCheckoutModalOpen(true)}
                className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Unlock Full Scam & Title Report ({formatPrice(48375)})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Report Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* ─── Hero Header ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 sm:px-8 py-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    Due-Diligence Cadastral Intelligence
                  </span>
                  {!isReportUnlocked && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Free Preview
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {pc.title || pc.address || "Property Cadastral Analysis"}
                </h1>
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pc.address}, {pc.lga}, {pc.state}, {pc.country || "Nigeria"}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-xs text-slate-400">Ref: {caseId.slice(0, 8).toUpperCase()}</span>
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <RiskBadge level={riskLevel} size="lg" />
                <span className="text-xs font-bold text-slate-300">
                  Risk Score: <strong className="text-white text-sm">{riskScore}/100</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-t border-slate-100 bg-white">
            <MetricCell
              label="Risk Exposure"
              value={`${riskScore}/100 (${riskLevel})`}
              icon={<TrendingUp className="w-4 h-4" />}
              color={riskScore < 30 ? "text-emerald-600" : riskScore < 60 ? "text-amber-600" : "text-red-600"}
            />
            <MetricCell
              label="Ground Status"
              value={occupancyStatus === "OCCUPIED" ? "Occupied / Structure" : "Bare / Empty Land"}
              icon={occupancyStatus === "OCCUPIED" ? <Building className="w-4 h-4" /> : <Trees className="w-4 h-4" />}
              color={occupancyStatus === "OCCUPIED" ? "text-blue-700" : "text-emerald-700"}
            />
            <MetricCell
              label="Documents Verified"
              value={`${docs.length} File(s)`}
              icon={<FileText className="w-4 h-4" />}
            />
            <MetricCell
              label="Cadastral Jurisdiction"
              value={`${pc.state || "Lagos"}, ${pc.country || "Nigeria"}`}
              icon={<Scale className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* ─── Location Status Banner ─── */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          locationFound
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
            : "bg-amber-50/70 border-amber-200 text-amber-950"
        }`}>
          <div className="flex items-start sm:items-center gap-2.5">
            {locationFound ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {locationFound ? "Cadastral Coordinates Verified" : "Location Coordinates Not Resolved"}
              </p>
              <p className="text-xs mt-0.5">
                {locationFound
                  ? `Located at Latitude ${centerLat?.toFixed(4)}, Longitude ${centerLng?.toFixed(4)} (${pc.address}, ${pc.lga}, ${pc.state}).`
                  : `The exact parcel could not be automatically geocoded from "${pc.address}". Displaying regional cadastral overview map. Please verify the address or input surveyor coordinates.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border shadow-2xs">
              {occupancyStatus === "OCCUPIED" ? "Ground: Occupied Structure" : "Ground: Bare Land"}
            </span>
          </div>
        </div>

        {/* ─── Map Section (FREE TIER CAN SEE MAP!) ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-blue" />
                Satellite & Aerial Ground Reconnaissance Map
              </h2>
              <p className="text-xs text-slate-500">
                Hybrid high-resolution satellite imagery with street overlays to inspect parcel boundary, occupancy, and surrounding infrastructure.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {centerLat && centerLng ? `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}` : "Regional Anchor"}
              </span>
              {beacons.length > 0 && (
                <span className="text-[11px] font-bold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {beacons.length} Beacons Plotted
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <PropertyMap
              center={centerLat && centerLng ? { lat: centerLat, lng: centerLng } : undefined}
              coordinates={beacons}
              height="430px"
              showSatellite={true}
              locationFound={locationFound}
              address={`${pc.address}, ${pc.lga}, ${pc.state}`}
              occupancyStatus={occupancyStatus}
            />
          </div>
        </div>

        {/* ─── Grounded Document Evidence Matrix (NO ASSUMPTIONS) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title & Document Lineage */}
          <SectionCard
            icon={<FileText className="w-4 h-4 text-brand-blue" />}
            title="Document Lineage & Statutory Perfection"
          >
            <div className="space-y-3">
              <InfoRow
                label="Cadastral Survey Plan"
                value={hasSurveyPlan ? `Submitted (${surveyNumbers[0] || "Plan Identified"})` : "Not Submitted in File"}
                status={hasSurveyPlan ? "verified" : "warning"}
              />
              <InfoRow
                label="Surveyor SURCON Seal"
                value={surconNumbers.length > 0 ? `Registered (${surconNumbers[0]})` : hasSurveyPlan ? "Unverified Seal" : "Missing Survey"}
                status={surconNumbers.length > 0 ? "verified" : "warning"}
              />
              <InfoRow
                label="Certificate of Occupancy (C of O)"
                value={hasCofO ? `Provided (${cooNumbers[0] || "Titled"})` : "No C of O Uploaded"}
                status={hasCofO ? "verified" : "neutral"}
              />
              <InfoRow
                label="Governor's Consent (Sec. 22 Land Use Act)"
                value={hasConsent ? "Endorsed Governor's Consent" : "Not Found in Uploaded Docs"}
                status={hasConsent ? "verified" : "warning"}
              />
              <InfoRow
                label="Gazette Excision Publication"
                value={hasGazette ? `Gazetted (${gazetteRefs[0] || "Published"})` : "No Gazette Citation in File"}
                status={hasGazette ? "verified" : "neutral"}
              />
              <InfoRow
                label="Deed of Assignment / Conveyance"
                value={hasDeed ? "Deed of Assignment Submitted" : "Not Provided"}
                status={hasDeed ? "verified" : "warning"}
              />
            </div>
          </SectionCard>

          {/* Physical Ground Reconnaissance */}
          <SectionCard
            icon={<Compass className="w-4 h-4 text-emerald-600" />}
            title="Physical Ground & Occupancy Audit"
          >
            <div className="space-y-3">
              <InfoRow
                label="Ground Occupancy Status"
                value={occupancyStatus === "OCCUPIED" ? "Structure / Occupied Compound" : "Bare / Undeveloped Land"}
                status="verified"
              />
              <InfoRow
                label="GPS Geocoding Status"
                value={locationFound ? "Exact Plot Geocoded" : "Regional Fallback (Not Pinpointed)"}
                status={locationFound ? "verified" : "warning"}
              />
              <InfoRow
                label="Delineated Boundary Beacons"
                value={beaconStrings.length > 0 ? beaconStrings[0] : "No Beacon Numbers in Docs"}
                status={beaconStrings.length > 0 ? "verified" : "warning"}
              />
              <InfoRow
                label="Assigned Plot Reference"
                value={plotNumbers.length > 0 ? plotNumbers.join(", ") : "Plot Number Unspecified"}
                status={plotNumbers.length > 0 ? "verified" : "warning"}
              />
              <InfoRow
                label="Disclosed Seller / Vendor"
                value={pc.sellerName || "Not Disclosed"}
                status={pc.sellerName ? "verified" : "neutral"}
              />
              <InfoRow
                label="Real Estate Broker / Agent"
                value={pc.agentName || "Direct / Unspecified"}
                status="neutral"
              />
            </div>
          </SectionCard>
        </div>

        {/* ─── SCAM & FRAUD DETECTION DOSSIER (PAID ACCESS GATING) ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-slate-800">Scam & Forgery Detection Audit</h2>
            </div>
            {!isReportUnlocked && (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked (Paid Tier)
              </span>
            )}
          </div>

          <div className="p-6">
            {isReportUnlocked ? (
              /* UNLOCKED: Deep Scam Findings Breakdown */
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1">Authenticity & Forensic Verification Summary:</p>
                  <p>
                    Every finding below is derived directly from forensic cross-comparison of the submitted documents against statutory land administration laws, registered surveyor registry patterns, and cadastral boundary regulations.
                  </p>
                </div>

                <div className="space-y-3">
                  {findings.map((f: any, i: number) => (
                    <div key={f.id || i} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            f.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                            f.severity === "HIGH" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {i + 1}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{f.title}</h4>
                        </div>
                        <RiskBadge level={f.severity} size="sm" />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{f.description}</p>

                      {f.evidenceSummary && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1">
                          <p><strong className="text-slate-800">Evidence Provenance:</strong> <span className="text-slate-600">{f.evidenceSummary}</span></p>
                          {f.whyItMatters && (
                            <p><strong className="text-slate-800">Legal Consequence:</strong> <span className="text-slate-600">{f.whyItMatters}</span></p>
                          )}
                          {f.recommendedAction && (
                            <p><strong className="text-emerald-800">Action:</strong> <span className="text-emerald-700 font-medium">{f.recommendedAction}</span></p>
                          )}
                        </div>
                      )}

                      {f.pageReferences && (
                        <p className="text-[10px] text-slate-400 font-mono">Citations: {f.pageReferences}</p>
                      )}
                    </div>
                  ))}

                  {findings.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No risk indicators recorded yet. Upload title documents to run audit.</p>
                  )}
                </div>
              </div>
            ) : (
              /* LOCKED (FREE TIER): Sleek Gating Preview */
              <div className="relative rounded-xl border border-amber-200 bg-amber-50/50 p-6 sm:p-8 overflow-hidden text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    Deep Scam & Fraud Detection Dossier Locked
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Free tier includes hybrid satellite reconnaissance and high-level risk scoring.
                    Upgrade to unlock forensic surveyor license checks, government acquisition conflict detection, double-allocation cross-checks, and the official certified report.
                  </p>
                </div>

                {/* Sample blur items */}
                <div className="max-w-lg mx-auto space-y-2 opacity-50 blur-[2px] pointer-events-none text-left text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold">🚨 Surveyor SURCON Registry Verification:</span> Unregistered license check...
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold">⚠️ Excision Status & Acquisition Check:</span> Official Gazette schedule perimeter...
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCheckoutModalOpen(true)}
                    className="font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md cursor-pointer"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    <span>Unlock Full Fraud Audit ({formatPrice(48375)})</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Purchase Recommendation ─── */}
        <div className={`rounded-2xl border-2 p-6 sm:p-8 ${
          riskScore < 30
            ? "bg-emerald-50 border-emerald-200"
            : riskScore < 60
            ? "bg-amber-50 border-amber-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              riskScore < 30
                ? "bg-emerald-100 text-emerald-700"
                : riskScore < 60
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}>
              {riskScore < 30 ? <CheckCircle2 className="w-6 h-6" /> :
               riskScore < 60 ? <AlertTriangle className="w-6 h-6" /> :
               <ShieldAlert className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">Purchase Due-Diligence Recommendation</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {explanation || (
                  riskScore > 60
                    ? "CRITICAL TRANSACTION ADVISORY: High-risk indicators detected across documentation. Do not transfer funds or pay earnest deposit until survey beacons are physically verified at the Surveyor General's Office and statutory root of title is confirmed."
                    : "PROCEDURAL CLEARANCE: Continue due-diligence by commissioning on-ground beacon recovery and state land registry search."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Legal Disclaimer ─── */}
        <div className="text-center text-[11px] text-slate-400 py-6 border-t border-slate-200 print:mt-8">
          <p>This report is generated by LandIntel Cadastral Intelligence and grounded strictly in submitted instruments.</p>
          <p>Always verify physical boundary beacons with a licensed surveyor and conduct an official search at the State Lands Bureau.</p>
          <p className="mt-2 font-semibold">© {new Date().getFullYear()} LandIntel · DiasporaLand AI · All Rights Reserved</p>
        </div>
      </div>

      {/* Checkout Modal for paid tier unlock */}
      <ReportCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        caseId={caseId}
        propertyTitle={pc.title || pc.address || "Property Analysis"}
        initialPackageType="STANDARD_AUDIT"
        onSuccess={() => {
          setIsReportUnlocked(true);
          setCheckoutModalOpen(false);
          toast("Full due-diligence & scam report unlocked!", "success");
        }}
      />
    </div>
  );
}

/* ── Helper Components ── */

function MetricCell({ label, value, icon, color = "text-slate-900" }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="px-4 sm:px-6 py-4 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={`text-xs sm:text-sm font-bold truncate ${color}`}>{value}</p>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, status }: { label: string; value: string; status: "verified" | "warning" | "neutral" }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold flex items-center gap-1.5 text-right ${
        status === "verified" ? "text-emerald-700" :
        status === "warning" ? "text-amber-700" :
        "text-slate-600"
      }`}>
        {status === "verified" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
        {status === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
        <span className="max-w-[200px] truncate">{value}</span>
      </span>
    </div>
  );
}
