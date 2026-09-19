import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const CanadaAdapter: JurisdictionAdapter = {
  countryCode: "CA",
  name: "Canada",
  legalSystem: "Common Law (Provincial Land Titles Acts; Civil Law in Quebec)",
  landRegistrationSystem: "Provincial Land Titles / Registry Systems (e.g. Teranet OnLand in Ontario)",
  primaryCurrency: "CAD",
  timezone: "America/Toronto",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "Provincial PIN extraction, Parcel Register analysis, and Surveyor's Real Property Report checks supported.",

  officialRegistries: [
    {
      name: "Land Registry Office (LRO / Teranet OnLand / SPIN2 / BC LTSA)",
      description: "Provincial electronic land registration databases issuing Property Identification Numbers (PIN).",
      level: "STATE_PROVINCIAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "PARCEL_REGISTER",
      label: "Parcel Register (Title Search)",
      description: "Official provincial digital abstract showing PIN, registered owners, mortgages, and instruments.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "TRANSFER_DEED",
      label: "Transfer / Deed of Land",
      description: "Standard electronic transfer registered under the Land Registration Reform Act.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "SRPR",
      label: "Surveyor's Real Property Report (SRPR)",
      description: "Legal survey plan prepared by an Ontario/Provincial Land Surveyor showing boundary lines and structures.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
  ],

  verificationChecklist: [
    {
      key: "parcel_register_pin_check",
      title: "Parcel Register PIN & Title Search",
      description: "Confirm ownership, estate qualifiers (LTCQ vs LT Absolute), and check for registered charges/writs of execution.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "srpr_boundary_check",
      title: "Surveyor's Real Property Report (SRPR) Inspection",
      description: "Verify building location, easements, and encroachments against municipal zoning bylaws.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("parcel register") || lower.includes("onland") || lower.includes("property identifier")) {
      return {
        category: "PARCEL_REGISTER",
        categoryLabel: "Parcel Register",
        confidence: 0.95,
        summary: "Provincial Land Registry Parcel Register abstract.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("surveyor's real property report") || lower.includes("srpr") || lower.includes("land surveyor")) {
      return {
        category: "SRPR",
        categoryLabel: "Surveyor's Real Property Report",
        confidence: 0.93,
        summary: "Cadastral Real Property Report prepared by a licensed Land Surveyor.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting Canadian real estate documentation.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const pinMatch = text.match(/(?:pin|property\s+identifier)\s*[:.]?\s*([0-9]{5}-[0-9]{4})/i);
    if (pinMatch) {
      fields.push({
        fieldName: "pin_number",
        fieldValue: pinMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.96,
        sourceSnippet: pinMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    const contradictions: ReconciledContradiction[] = [];
    const pinItems = documents.flatMap((d) =>
      d.extractions.filter((e) => e.fieldName === "pin_number").map((e) => ({ ...e, docName: d.originalName, docId: d.id }))
    );

    if (pinItems.length >= 2) {
      const canonical = pinItems[0].fieldValue;
      const mismatch = pinItems.find((p) => p.fieldValue !== canonical);
      if (mismatch) {
        contradictions.push({
          field: "pin_number",
          title: "Property Identification Number (PIN) Mismatch",
          severity: "CRITICAL",
          category: "CONSISTENCY",
          description: `Discrepancy: "${pinItems[0].fieldValue}" in ${pinItems[0].docName} vs "${mismatch.fieldValue}" in ${mismatch.docName}.`,
          docAId: pinItems[0].docId,
          docAName: pinItems[0].docName,
          docAPage: pinItems[0].pageNumber,
          docAValue: pinItems[0].fieldValue,
          docBId: mismatch.docId,
          docBName: mismatch.docName,
          docBPage: mismatch.pageNumber,
          docBValue: mismatch.fieldValue,
          whyItMatters: "PIN numbers uniquely identify Canadian parcels. A mismatch indicates different properties.",
          recommendedAction: "Confirm PIN with the Land Registry Office (LRO) before executing agreements.",
          isPremiumLocked: true,
        });
      }
    }

    return contradictions;
  },
};
