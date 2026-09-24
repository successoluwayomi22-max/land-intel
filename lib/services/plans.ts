export type PlanKey = "FREE" | "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE";

export const STATUTORY_VAT_RATE = 0.075; // 7.5% Statutory VAT in Nigeria

export interface PriceTaxBreakdown {
  subtotal: number;
  vatRate: number;
  vatRatePercent: string;
  vatAmount: number;
  total: number;
}

export function calculatePriceTaxBreakdown(subtotal: number, vatRate = STATUTORY_VAT_RATE): PriceTaxBreakdown {
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;
  return {
    subtotal,
    vatRate,
    vatRatePercent: `${(vatRate * 100).toFixed(1)}%`,
    vatAmount,
    total,
  };
}

export type OneOffPackageKey = "STANDARD_AUDIT" | "FULL_TITLE_VERIFICATION";

export interface OneOffPackageDefinition {
  key: OneOffPackageKey;
  badge?: string;
  name: string;
  priceNgn: number;
  priceUsd: number;
  vatRate: number;
  vatAmountNgn: number;
  totalPriceNgn: number;
  totalPriceUsd: number;
  subtitle: string;
  deliverableTimeframe: string;
  features: string[];
}

export const ONE_OFF_PACKAGES: Record<OneOffPackageKey, OneOffPackageDefinition> = {
  STANDARD_AUDIT: {
    key: "STANDARD_AUDIT",
    badge: "INSTANT AUTOMATED AUDIT",
    name: "Instant Cadastral Audit",
    priceNgn: 69767,
    priceUsd: 46.51,
    vatRate: STATUTORY_VAT_RATE,
    vatAmountNgn: 5233,
    totalPriceNgn: 75000, // ₦75,000 clean Naira total ($50.00 USD)
    totalPriceUsd: 50.00, // $50 USD clean base
    subtitle: "Single property automated deep-scan & risk scorecard",
    deliverableTimeframe: "Instant Access",
    features: [
      "Instant LandIntel 15-Section Audit",
      "Beacon & Boundary Discrepancy Matrix",
      "Cross-Document Conflict Analysis",
      "Automated Acquisition Verdict (Buy/Don't Buy)",
      "Surveyor & Lawyer Inquiry Checklists",
      "Publication-Grade Certified PDF Download",
    ],
  },
  FULL_TITLE_VERIFICATION: {
    key: "FULL_TITLE_VERIFICATION",
    badge: "FULL LEGAL SEARCH",
    name: "Full Title Verification Package",
    priceNgn: 279070,
    priceUsd: 186.05,
    vatRate: STATUTORY_VAT_RATE,
    vatAmountNgn: 20930,
    totalPriceNgn: 300000, // ₦300,000 clean Naira total ($200.00 USD)
    totalPriceUsd: 200.00, // $200 USD clean base
    subtitle: "Official Ministry registry search, Surveyor General charting & written legal opinion",
    deliverableTimeframe: "Priority 48–72 Hour Express Deliverable",
    features: [
      "Instant LandIntel 15-Section Audit",
      "State Lands Bureau Registry Search (Alausa / AGIS)",
      "Office of the Surveyor General Charting Report",
      "Written Legal Verdict by Retained Nigerian Lawyer",
      "Physical Site Inspection & Video Walk-Through",
      "Priority 48–72 Hour Express Deliverable",
    ],
  },
};

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  priceNgn: number;
  priceUsd: number;
  vatRate?: number;
  totalPriceNgn?: number;
  totalPriceUsd?: number;
  maxActiveCases: number;
  maxDocumentsPerCase: number;
  maxFileSizeBytes: number;
  maxAiQuestionsPerCase: number;
  aiCreditQuotaMonthly: number;
  storageLimitBytes: number;
  entitlements: string[];
}

export const ENTITLEMENT_KEYS = {
  CASE_CREATE: "CASE_CREATE",
  DOCUMENT_UPLOAD: "DOCUMENT_UPLOAD",
  BASIC_OCR: "BASIC_OCR",
  ADVANCED_OCR: "ADVANCED_OCR",
  BASIC_EXTRACTION: "BASIC_EXTRACTION",
  ADVANCED_EXTRACTION: "ADVANCED_EXTRACTION",
  BASIC_ANALYSIS: "BASIC_ANALYSIS",
  ADVANCED_ANALYSIS: "ADVANCED_ANALYSIS",
  BASIC_RECONCILIATION: "BASIC_RECONCILIATION",
  ADVANCED_RECONCILIATION: "ADVANCED_RECONCILIATION",
  BASIC_RISK: "BASIC_RISK",
  ADVANCED_RISK: "ADVANCED_RISK",
  EXTERNAL_VERIFICATION: "EXTERNAL_VERIFICATION",
  GEOSPATIAL_ANALYSIS: "GEOSPATIAL_ANALYSIS",
  BASIC_AI_ASSISTANT: "BASIC_AI_ASSISTANT",
  ADVANCED_AI_ASSISTANT: "ADVANCED_AI_ASSISTANT",
  BASIC_REPORT: "BASIC_REPORT",
  FULL_REPORT: "FULL_REPORT",
  ADVANCED_REPORT: "ADVANCED_REPORT",
  TRANSLATION: "TRANSLATION",
  ADVANCED_TRANSLATION: "ADVANCED_TRANSLATION",
  HISTORICAL_ANALYSIS: "HISTORICAL_ANALYSIS",
  PROFESSIONAL_REVIEW: "PROFESSIONAL_REVIEW",
  ADVANCED_EXPORTS: "ADVANCED_EXPORTS",
  TEAM_COLLABORATION: "TEAM_COLLABORATION",
  ADVANCED_ANALYTICS: "ADVANCED_ANALYTICS",
  API_ACCESS: "API_ACCESS",
  PRIORITY_PROCESSING: "PRIORITY_PROCESSING",
  EXTENDED_STORAGE: "EXTENDED_STORAGE",
} as const;

export const PLANS: Record<PlanKey, PlanDefinition> = {
  FREE: {
    key: "FREE",
    name: "Free Preview",
    priceNgn: 0,
    priceUsd: 0,
    vatRate: 0,
    totalPriceNgn: 0,
    totalPriceUsd: 0,
    maxActiveCases: 1,
    maxDocumentsPerCase: 2,
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    maxAiQuestionsPerCase: 3,
    aiCreditQuotaMonthly: 10,
    storageLimitBytes: 25 * 1024 * 1024, // 25MB
    entitlements: [
      ENTITLEMENT_KEYS.CASE_CREATE,
      ENTITLEMENT_KEYS.DOCUMENT_UPLOAD,
      ENTITLEMENT_KEYS.BASIC_OCR,
      ENTITLEMENT_KEYS.BASIC_EXTRACTION,
      ENTITLEMENT_KEYS.BASIC_ANALYSIS,
      ENTITLEMENT_KEYS.BASIC_RECONCILIATION,
      ENTITLEMENT_KEYS.BASIC_RISK,
      ENTITLEMENT_KEYS.BASIC_AI_ASSISTANT,
      ENTITLEMENT_KEYS.BASIC_REPORT,
    ],
  },
  STARTER: {
    key: "STARTER",
    name: "Starter Investor",
    priceNgn: 69767,
    priceUsd: 46.51,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 75000, // ₦69,767 + 7.5% VAT (₦5,233)
    totalPriceUsd: 50.00, // $50 USD clean base
    maxActiveCases: 5,
    maxDocumentsPerCase: 15,
    maxFileSizeBytes: 25 * 1024 * 1024, // 25MB
    maxAiQuestionsPerCase: 25,
    aiCreditQuotaMonthly: 150,
    storageLimitBytes: 1024 * 1024 * 1024, // 1GB
    entitlements: [
      ENTITLEMENT_KEYS.CASE_CREATE,
      ENTITLEMENT_KEYS.DOCUMENT_UPLOAD,
      ENTITLEMENT_KEYS.BASIC_OCR,
      ENTITLEMENT_KEYS.ADVANCED_OCR,
      ENTITLEMENT_KEYS.BASIC_EXTRACTION,
      ENTITLEMENT_KEYS.ADVANCED_EXTRACTION,
      ENTITLEMENT_KEYS.BASIC_ANALYSIS,
      ENTITLEMENT_KEYS.BASIC_RECONCILIATION,
      ENTITLEMENT_KEYS.BASIC_RISK,
      ENTITLEMENT_KEYS.BASIC_AI_ASSISTANT,
      ENTITLEMENT_KEYS.FULL_REPORT,
      ENTITLEMENT_KEYS.ADVANCED_EXPORTS,
    ],
  },
  PROFESSIONAL: {
    key: "PROFESSIONAL",
    name: "Professional Portfolio",
    priceNgn: 209302,
    priceUsd: 139.53,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 225000, // ₦209,302 + 7.5% VAT (₦15,698)
    totalPriceUsd: 150.00, // $150 USD clean base
    maxActiveCases: 25,
    maxDocumentsPerCase: 50,
    maxFileSizeBytes: 50 * 1024 * 1024, // 50MB
    maxAiQuestionsPerCase: 100,
    aiCreditQuotaMonthly: 500,
    storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10GB
    entitlements: [
      ENTITLEMENT_KEYS.CASE_CREATE,
      ENTITLEMENT_KEYS.DOCUMENT_UPLOAD,
      ENTITLEMENT_KEYS.BASIC_OCR,
      ENTITLEMENT_KEYS.ADVANCED_OCR,
      ENTITLEMENT_KEYS.BASIC_EXTRACTION,
      ENTITLEMENT_KEYS.ADVANCED_EXTRACTION,
      ENTITLEMENT_KEYS.BASIC_ANALYSIS,
      ENTITLEMENT_KEYS.ADVANCED_ANALYSIS,
      ENTITLEMENT_KEYS.BASIC_RECONCILIATION,
      ENTITLEMENT_KEYS.ADVANCED_RECONCILIATION,
      ENTITLEMENT_KEYS.BASIC_RISK,
      ENTITLEMENT_KEYS.ADVANCED_RISK,
      ENTITLEMENT_KEYS.EXTERNAL_VERIFICATION,
      ENTITLEMENT_KEYS.GEOSPATIAL_ANALYSIS,
      ENTITLEMENT_KEYS.BASIC_AI_ASSISTANT,
      ENTITLEMENT_KEYS.ADVANCED_AI_ASSISTANT,
      ENTITLEMENT_KEYS.BASIC_REPORT,
      ENTITLEMENT_KEYS.FULL_REPORT,
      ENTITLEMENT_KEYS.ADVANCED_REPORT,
      ENTITLEMENT_KEYS.TRANSLATION,
      ENTITLEMENT_KEYS.ADVANCED_TRANSLATION,
      ENTITLEMENT_KEYS.HISTORICAL_ANALYSIS,
      ENTITLEMENT_KEYS.ADVANCED_EXPORTS,
      ENTITLEMENT_KEYS.PRIORITY_PROCESSING,
      ENTITLEMENT_KEYS.EXTENDED_STORAGE,
    ],
  },
  BUSINESS: {
    key: "BUSINESS",
    name: "Commercial & Firm",
    priceNgn: 350000,
    priceUsd: 240,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 376250, // ₦350,000 + 7.5% VAT (₦26,250)
    totalPriceUsd: 258.0, // $240 + 7.5% VAT ($18.00)
    maxActiveCases: 100,
    maxDocumentsPerCase: 100,
    maxFileSizeBytes: 100 * 1024 * 1024, // 100MB
    maxAiQuestionsPerCase: 300,
    aiCreditQuotaMonthly: 2000,
    storageLimitBytes: 50 * 1024 * 1024 * 1024, // 50GB
    entitlements: [
      ...Object.values(ENTITLEMENT_KEYS).filter((k) => k !== "PROFESSIONAL_REVIEW"),
      ENTITLEMENT_KEYS.TEAM_COLLABORATION,
      ENTITLEMENT_KEYS.ADVANCED_ANALYTICS,
      ENTITLEMENT_KEYS.API_ACCESS,
    ],
  },
  ENTERPRISE: {
    key: "ENTERPRISE",
    name: "Enterprise Sovereign",
    priceNgn: 1500000,
    priceUsd: 1000,
    vatRate: STATUTORY_VAT_RATE,
    totalPriceNgn: 1612500, // ₦1,500,000 + 7.5% VAT (₦112,500)
    totalPriceUsd: 1075.0, // $1,000 + 7.5% VAT ($75.00)
    maxActiveCases: 10000,
    maxDocumentsPerCase: 500,
    maxFileSizeBytes: 250 * 1024 * 1024, // 250MB
    maxAiQuestionsPerCase: 1000,
    aiCreditQuotaMonthly: 10000,
    storageLimitBytes: 500 * 1024 * 1024 * 1024, // 500GB
    entitlements: Object.values(ENTITLEMENT_KEYS),
  },
};

export function hasPlanEntitlement(planKey: PlanKey, entitlement: string): boolean {
  const plan = PLANS[planKey];
  if (!plan) return false;
  return plan.entitlements.includes(entitlement);
}

export const hasEntitlement = hasPlanEntitlement;

