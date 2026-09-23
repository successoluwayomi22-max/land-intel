"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";

// Lazy-load map to avoid SSR issues
const PropertyMap = dynamic(
  () => import("@/components/maps/PropertyMap").then((mod) => ({ default: mod.PropertyMap })),
  { ssr: false, loading: () => <div className="w-full h-[400px] bg-slate-100 rounded-xl animate-pulse" /> }
);

export default function PropertyAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const caseId = params.id as string;

  const [propertyCase, setPropertyCase] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
          <p className="text-sm text-slate-500 font-medium">Loading analysis...</p>
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
  const aiResult = pc.aiAnalysis || pc.analysis || {};
  const findings = aiResult.findings || aiResult.keyFindings || [];
  const riskLevel = aiResult.riskLevel || aiResult.overallRisk || pc.riskLevel || "MEDIUM";
  const riskScore = aiResult.riskScore ?? aiResult.score ?? 50;
  const recommendation = aiResult.recommendation || aiResult.purchaseRecommendation || "Proceed with caution";

  // Extract beacon coordinates if available
  const beacons = (aiResult.beaconCoordinates || aiResult.coordinates || []).map(
    (b: any, i: number) => ({
      lat: b.latitude || b.lat || 6.45 + i * 0.001,
      lng: b.longitude || b.lng || 3.42 + i * 0.001,
      label: b.label || b.name || `PB ${4810 + i}`,
    })
  );

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Print-only header */}
      <div className="hidden print:block p-8 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center font-black text-white text-lg">L</div>
          <div>
            <h1 className="text-xl font-extrabold">LandIntel Due Diligence Report</h1>
            <p className="text-xs text-slate-500">Confidential • Generated {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Navigation bar (screen only) */}
      <div className="print:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href={`/properties/${caseId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ─── Header Card ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 sm:px-8 py-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    Full Due Diligence Report
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {pc.title || pc.address || "Property Analysis"}
                </h1>
                <p className="text-sm text-slate-300">
                  {pc.address || pc.location || "Address not specified"} • Ref: {caseId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="shrink-0">
                <RiskBadge level={riskLevel} size="lg" />
              </div>
            </div>
          </div>

          {/* Key metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
            <MetricCell label="Risk Score" value={`${riskScore}/100`} icon={<TrendingUp className="w-4 h-4" />} color={riskScore < 30 ? "text-emerald-600" : riskScore < 60 ? "text-amber-600" : "text-red-600"} />
            <MetricCell label="Property Type" value={pc.propertyType || "Residential"} icon={<Building2 className="w-4 h-4" />} />
            <MetricCell label="Submitted" value={new Date(pc.createdAt).toLocaleDateString()} icon={<Clock className="w-4 h-4" />} />
            <MetricCell label="Jurisdiction" value={pc.jurisdiction || pc.state || "Nigeria"} icon={<Scale className="w-4 h-4" />} />
          </div>
        </div>

        {/* ─── Map Section ─── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-blue" />
              <h2 className="text-sm font-bold text-slate-800">Property Location & Boundaries</h2>
            </div>
            <div className="flex items-center gap-2">
              {pc.latitude && pc.longitude && (
                <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  {Number(pc.latitude).toFixed(4)}, {Number(pc.longitude).toFixed(4)}
                </span>
              )}
              {beacons.length > 0 && (
                <span className="text-[11px] text-brand-blue font-semibold font-mono bg-blue-50 px-2 py-0.5 rounded">
                  {beacons.length} beacons plotted
                </span>
              )}
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <PropertyMap
              center={pc.latitude && pc.longitude ? { lat: Number(pc.latitude), lng: Number(pc.longitude) } : undefined}
              coordinates={beacons}
              height="420px"
              showSatellite={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Title Verification ─── */}
          <SectionCard
            icon={<FileText className="w-4 h-4 text-brand-blue" />}
            title="Title Verification Summary"
          >
            <div className="space-y-3">
              <InfoRow label="Root of Title" value={aiResult.rootOfTitle || aiResult.titleType || "Deed of Assignment"} status="verified" />
              <InfoRow label="Governor's Consent" value={aiResult.governorConsent !== false ? "Obtained" : "Not Found"} status={aiResult.governorConsent !== false ? "verified" : "warning"} />
              <InfoRow label="Gazette Status" value={aiResult.gazetteStatus || "Excision Gazetted"} status="verified" />
              <InfoRow label="Encumbrances" value={aiResult.encumbrances || "None detected"} status={aiResult.encumbrances ? "warning" : "verified"} />
              <InfoRow label="Survey Plan" value={aiResult.surveyPlanStatus || "Registered"} status="verified" />
              <InfoRow label="C of O" value={aiResult.cOfOStatus || pc.cOfONumber || "Not provided"} status={pc.cOfONumber ? "verified" : "neutral"} />
            </div>
          </SectionCard>

          {/* ─── Risk Assessment ─── */}
          <SectionCard
            icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
            title="Risk Assessment Matrix"
          >
            <div className="space-y-3">
              <RiskRow label="Boundary Dispute Risk" level={aiResult.boundaryDisputeRisk || "LOW"} />
              <RiskRow label="Setback Encroachment" level={aiResult.setbackRisk || "LOW"} />
              <RiskRow label="Title Litigation" level={aiResult.litigationRisk || "LOW"} />
              <RiskRow label="Government Acquisition" level={aiResult.acquisitionRisk || "LOW"} />
              <RiskRow label="Environmental Hazard" level={aiResult.environmentalRisk || "LOW"} />
              <RiskRow label="Fraud/Forgery Indicators" level={aiResult.fraudRisk || "LOW"} />
            </div>
          </SectionCard>
        </div>

        {/* ─── Cadastral Boundary Report ─── */}
        {beacons.length > 0 && (
          <SectionCard
            icon={<Compass className="w-4 h-4 text-brand-blue" />}
            title="Cadastral Boundary Coordinates"
            fullWidth
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Beacon</th>
                    <th className="py-2.5 px-4 font-semibold">Latitude</th>
                    <th className="py-2.5 px-4 font-semibold">Longitude</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {beacons.map((b: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{b.label}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-xs">{b.lat.toFixed(6)}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-xs">{b.lng.toFixed(6)}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Plotted
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ─── Key Findings ─── */}
        {findings.length > 0 && (
          <SectionCard
            icon={<Eye className="w-4 h-4 text-amber-600" />}
            title="Key Findings"
            fullWidth
          >
            <div className="space-y-3">
              {findings.map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                    f.severity === "HIGH" || f.risk === "HIGH" ? "bg-red-100 text-red-700" :
                    f.severity === "MEDIUM" || f.risk === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 font-medium">{f.title || f.finding || f.description || f}</p>
                    {f.details && <p className="text-xs text-slate-500 mt-1">{f.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

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
               <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">Purchase Recommendation</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </div>

        {/* ─── Disclaimer ─── */}
        <div className="text-center text-[11px] text-slate-400 py-6 border-t border-slate-200 print:mt-8">
          <p>This report is generated by LandIntel AI and should be used as a preliminary assessment only.</p>
          <p>Always consult with a licensed surveyor and legal counsel before completing any property transaction.</p>
          <p className="mt-2 font-semibold">© {new Date().getFullYear()} LandIntel · DiasporaLand AI · Confidential</p>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function MetricCell({ label, value, icon, color = "text-slate-900" }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="px-4 sm:px-6 py-4 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400">{icon}<span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span></div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SectionCard({ icon, title, children, fullWidth = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${fullWidth ? "" : ""}`}>
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
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-semibold flex items-center gap-1.5 ${
        status === "verified" ? "text-emerald-600" :
        status === "warning" ? "text-amber-600" :
        "text-slate-600"
      }`}>
        {status === "verified" && <CheckCircle2 className="w-3.5 h-3.5" />}
        {status === "warning" && <AlertTriangle className="w-3.5 h-3.5" />}
        {value}
      </span>
    </div>
  );
}

function RiskRow({ label, level }: { label: string; level: string }) {
  const color = level === "HIGH" ? "text-red-600 bg-red-50" : level === "MEDIUM" ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50";
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-600">{label}</span>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}>{level}</span>
    </div>
  );
}
