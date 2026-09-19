export type SupportLevel = "LEVEL_1" | "LEVEL_2" | "LEVEL_3";

export interface JurisdictionDocumentType {
  id: string;
  label: string;
  description: string;
  isStatutoryTitle: boolean;
  requiresCadastralCheck: boolean;
}

export interface ExtractedCadastralField {
  fieldName: string;
  fieldValue: string;
  pageNumber: number;
  confidence: number;
  sourceSnippet?: string;
}

export interface DocumentClassificationResult {
  category: string;
  categoryLabel: string;
  confidence: number;
  summary: string;
  isRecognizedInJurisdiction: boolean;
}

export interface VerificationChecklistItem {
  key: string;
  title: string;
  description: string;
  requiresProfessional: boolean;
  category: "STATUTORY_TITLE" | "CADASTRAL_BOUNDARY" | "OWNERSHIP_LINEAGE" | "PLANNING_ZONING" | "PHYSICAL_INSPECTION";
}

export interface ReconciledContradiction {
  field: string;
  title: string;
  severity: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  category: "CONSISTENCY" | "DOCUMENTATION" | "OWNERSHIP" | "GEOGRAPHIC" | "TRANSACTION";
  description: string;
  docAId: string;
  docAName: string;
  docAPage: number;
  docAValue: string;
  docBId: string;
  docBName: string;
  docBPage: number;
  docBValue: string;
  whyItMatters: string;
  recommendedAction: string;
  isPremiumLocked: boolean;
}

export interface JurisdictionAdapter {
  countryCode: string; // ISO 3166-1 alpha-2
  name: string;
  legalSystem: string;
  landRegistrationSystem: string;
  primaryCurrency: string;
  timezone: string;
  supportLevel: SupportLevel;
  supportLevelNotice?: string;
  officialRegistries: Array<{
    name: string;
    description: string;
    level: "NATIONAL" | "STATE_PROVINCIAL" | "COUNTY_MUNICIPAL";
    isDigitalSearchAvailable: boolean;
  }>;
  commonDocuments: JurisdictionDocumentType[];
  verificationChecklist: VerificationChecklistItem[];

  classifyDocument(text: string, filename: string): DocumentClassificationResult;
  extractEntities(text: string, category: string): ExtractedCadastralField[];
  reconcileDocuments(
    caseContext: { title: string; region: string; district: string; address: string },
    documents: Array<{
      id: string;
      originalName: string;
      category: string;
      extractions: ExtractedCadastralField[];
    }>
  ): ReconciledContradiction[];
}
