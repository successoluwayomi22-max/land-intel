export type DocumentClassification =
  | "SURVEY_PLAN"
  | "DEED_OF_ASSIGNMENT"
  | "CERTIFICATE_OF_OCCUPANCY"
  | "GOVERNORS_CONSENT"
  | "GAZETTE"
  | "ALLOCATION_LETTER"
  | "EXCISION_DOCUMENT"
  | "CONTRACT_OF_SALE"
  | "PURCHASE_RECEIPT"
  | "POWER_OF_ATTORNEY"
  | "OTHER"
  | "UNKNOWN";

export interface ExtractedEntity {
  fieldName: string;
  fieldValue: string;
  pageNumber: number;
  confidence: number;
  sourceSnippet?: string;
}

export interface DocumentAnalysisResult {
  category: DocumentClassification;
  confidence: number;
  summary: string;
  entities: ExtractedEntity[];
}

export interface CrossDocumentComparisonResult {
  field: string;
  status: "MATCH" | "MISMATCH" | "MISSING" | "UNCERTAIN" | "NOT_APPLICABLE";
  severity: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  description: string;
  evidence: string;
  docReferences: string[];
}

export interface GeneratedFinding {
  title: string;
  severity: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  category: "DOCUMENTATION" | "OWNERSHIP" | "GEOGRAPHIC" | "CONSISTENCY" | "COMPLETENESS" | "TRANSACTION";
  description: string;
  evidenceSummary: string;
  sourceDocIds: string[];
  pageReferences: string;
  whyItMatters: string;
  recommendedAction: string;
  isPremiumLocked: boolean;
}

export interface RiskAnalysisOutput {
  overallScore: number;
  level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  explanation: string;
  breakdown: {
    documentationScore: number;
    ownershipScore: number;
    geographicScore: number;
    consistencyScore: number;
  };
  findings: GeneratedFinding[];
}

export type PurchaseVerdict = "DO_NOT_BUY" | "DO_NOT_BUY_DEFECTIVE" | "CONDITIONAL" | "PROCEED";

export interface PurchaseVerdictDetails {
  verdict: PurchaseVerdict;
  headline: string;
  shortVerdict: "DO NOT BUY" | "CONDITIONAL" | "PROCEED";
  colorClass: string;
  bgClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  actionGuidance: string;
  summaryReason: string;
}

export function getPurchaseRecommendation(
  score: number,
  level: string,
  options?: { isSynthetic?: boolean; criticalFindingsCount?: number }
): PurchaseVerdictDetails {
  const normLevel = (level || "").toUpperCase();
  const isSynthetic = options?.isSynthetic ?? false;
  const criticalCount = options?.criticalFindingsCount ?? 0;

  if (isSynthetic || score >= 60 || normLevel === "CRITICAL" || normLevel === "HIGH" || criticalCount > 0) {
    return {
      verdict: "DO_NOT_BUY",
      headline: isSynthetic
        ? "DO NOT BUY — UNVERIFIED, FAKE, OR NON-CADASTRAL DATA"
        : "DO NOT BUY — CRITICAL RISK DETECTED",
      shortVerdict: "DO NOT BUY",
      colorClass: "text-rose-700",
      bgClass: "bg-rose-50 border-rose-200",
      badgeBg: "bg-rose-600",
      badgeText: "text-white",
      badgeBorder: "border-rose-700",
      actionGuidance:
        "DO NOT release deposits, transfer funds, or sign binding contracts. Severe title, boundary, or document verification failures were detected.",
      summaryReason: isSynthetic
        ? "The documentation or location details provided are unverified, synthetic, or non-cadastral. Purchasing this property represents an extreme risk of fraud or total loss."
        : "Critical title defects, boundary discrepancies, or unverified encumbrances make this property hazardous to acquire without full legal resolution.",
    };
  }

  if (score >= 41 || normLevel === "ELEVATED") {
    return {
      verdict: "DO_NOT_BUY_DEFECTIVE",
      headline: "DO NOT BUY YET — RESOLVE TITLE & CADASTRAL DEFECTS FIRST",
      shortVerdict: "DO NOT BUY",
      colorClass: "text-amber-800",
      bgClass: "bg-amber-50 border-amber-200",
      badgeBg: "bg-amber-600",
      badgeText: "text-white",
      badgeBorder: "border-amber-700",
      actionGuidance:
        "Pause negotiations. Require the seller to cure missing statutory consents, unverified survey beacons, or chain-of-title gaps before releasing payment.",
      summaryReason:
        "Substantial legal and cadastral defects were discovered. Acquiring the property in its current state may leave you with an unmarketable, disputed, or voidable title.",
    };
  }

  if (score >= 21 || normLevel === "MODERATE") {
    return {
      verdict: "CONDITIONAL",
      headline: "CONDITIONAL — PROCEED ONLY WITH STRICT CONTINGENCY CLAUSES",
      shortVerdict: "CONDITIONAL",
      colorClass: "text-blue-800",
      bgClass: "bg-blue-50 border-blue-200",
      badgeBg: "bg-blue-600",
      badgeText: "text-white",
      badgeBorder: "border-blue-700",
      actionGuidance:
        "Proceed with caution. Insert title warranty and escrow holdback clauses. Conduct an independent on-ground beacon pickup and official land registry verification.",
      summaryReason:
        "Baseline documentation is present but requires independent on-ground beacon pickup and official land registry certification before final payment.",
    };
  }

  return {
    verdict: "PROCEED",
    headline: "SUITABLE TO PROCEED — LOW DOCUMENTED RISK PROFILE",
    shortVerdict: "PROCEED",
    colorClass: "text-emerald-800",
    bgClass: "bg-emerald-50 border-emerald-200",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    badgeBorder: "border-emerald-700",
    actionGuidance:
      "Documentation satisfies statutory due-diligence criteria. Proceed to contract execution with standard registry confirmation.",
    summaryReason:
      "All submitted instruments demonstrate chain of title continuity with no severe encumbrances or boundary discrepancies identified.",
  };
}
