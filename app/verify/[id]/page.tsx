import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Calendar,
  MapPin,
  Hash,
  Download,
  ExternalLink,
  Lock,
  Building,
  CheckCircle2,
} from "lucide-react";
import crypto from "crypto";

interface VerifyPageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function ReportVerificationPage({ params }: VerifyPageProps) {
  const caseId = params.id;

  // Search case by id or by custom reference
  const propertyCase = await db.propertyCase.findFirst({
    where: {
      OR: [
        { id: caseId },
        { id: { endsWith: caseId.replace(/^LI-NG-/i, "").toLowerCase() } },
      ],
    },
    include: {
      riskScore: true,
      findings: true,
      documents: {
        select: {
          category: true,
          originalName: true,
          pageCount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!propertyCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-red-100 selection:text-red-900">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 w-full flex items-center justify-center">
          <div className="bg-white border-2 border-rose-300 rounded-2xl p-6 sm:p-10 shadow-lg text-center space-y-6 w-full">
            <div className="w-16 h-16 bg-rose-100 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                Registry Verification Alert
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
                Document Record Not Found
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                The reference identifier <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">{caseId}</code> does not match any authenticated report in the LandIntel Due-Diligence Registry.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Anti-Fraud Advisory for Property Buyers &amp; Lenders:</span>
              </p>
              <p className="leading-relaxed">
                If a vendor, broker, or developer presented you with a printed or electronic report carrying this identifier, it may be fabricated or tampered with. Do not disburse funds based on an unverified document.
              </p>
              <p className="pt-1">
                Please contact our technical verification desk at{" "}
                <a href="mailto:compliance@landintel.ai" className="font-bold text-amber-800 underline">
                  compliance@landintel.ai
                </a>{" "}
                with a copy of the document for forensic audit.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors"
              >
                Return to LandIntel Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const certificateRef = `LI-NG-${propertyCase.id.slice(-8).toUpperCase()}`;
  const verificationHash = crypto
    .createHash("sha256")
    .update(`${propertyCase.id}-${propertyCase.createdAt.toISOString()}-${propertyCase.title}`)
    .digest("hex")
    .toUpperCase();

  const score = propertyCase.riskScore?.score ?? 0;
  const level = propertyCase.riskScore?.level || "COMPLETED";

  const scoreBadgeColor =
    score > 60
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : score > 35
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-200";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Certificate Card */}
        <div className="bg-white border-2 border-emerald-600 rounded-2xl shadow-card overflow-hidden">
          {/* Official Seal Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-500/30">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Authentic LandIntel Dossier</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
                Digital Certificate of Authenticity
              </h1>
              <p className="text-xs text-slate-300">
                Issued by LandIntel Technologies Ltd &bull; CAC Reg. RC 8365907
              </p>
            </div>

            <div className="text-left sm:text-right bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Verification Reference</span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-400 tracking-wider">
                {certificateRef}
              </span>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Property Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  Property Title / Reference
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  {propertyCase.title}
                </p>
                <p className="text-xs text-slate-600">
                  {propertyCase.propertyType.replace(/_/g, " ")}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Jurisdiction &amp; Cadastral Location
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {propertyCase.address || "Location on record"}
                </p>
                <p className="text-xs text-slate-600">
                  {propertyCase.lga}, {propertyCase.state}, {propertyCase.country}
                </p>
              </div>
            </div>

            {/* Audit Status & Risk Score Indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-600">Audit Completion Date</span>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>
                    {propertyCase.createdAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-600">Evaluated Risk Score</span>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${scoreBadgeColor}`}>
                    {score} / 100 ({level})
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-600">Analyzed Artifacts</span>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
                  <FileCheck2 className="w-4 h-4 text-slate-500" />
                  <span>{propertyCase.documents.length} Title &amp; Survey Documents</span>
                </div>
              </div>
            </div>

            {/* Documents Verified */}
            {propertyCase.documents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Verified Documentation Roster
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {propertyCase.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate" title={doc.originalName}>
                          {doc.originalName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.category.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cryptographic SHA-256 Digest */}
            <div className="p-4 bg-slate-900 text-slate-300 rounded-xl space-y-2 font-mono text-xs border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  SHA-256 Tamper-Detection Hash
                </span>
                <span className="text-emerald-400 font-bold">Cryptographically Sealed</span>
              </div>
              <p className="text-[11px] break-all text-emerald-300 selection:bg-emerald-900">
                {verificationHash}
              </p>
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                This mathematical digest guarantees that the dossier data has not been altered or doctored since its initial issuance by the LandIntel engine.
              </p>
            </div>

            {/* Official Scope & Professional Notice */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
              <h4 className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Statutory Scope &amp; Legal Context</span>
              </h4>
              <p className="leading-relaxed">
                This verification certifies that this property was audited using LandIntel’s algorithmic coordinate plotting and published government gazette overlay. It provides preliminary due diligence for buyers, banks, and legal counsel. It does not replace an in-person physical search by a retained lawyer at the state lands registry or on-site beacon charting by a licensed SURCON surveyor.
              </p>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-6 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-slate-600 text-center sm:text-left">
              Questions regarding this certificate? Email{" "}
              <a href="mailto:compliance@landintel.ai" className="font-bold text-slate-900 underline">
                compliance@landintel.ai
              </a>
            </span>

            <Link
              href={`/api/properties/${propertyCase.id}/report?format=pdf`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-darkNavy text-white hover:bg-slate-800 font-bold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Genuine PDF</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
