import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const AustraliaAdapter: JurisdictionAdapter = {
  countryCode: "AU",
  name: "Australia",
  legalSystem: "Common Law (Torrens Title System under State Real Property Acts)",
  landRegistrationSystem: "State Land Titles Offices (e.g. NSW LRS, Land Use Victoria, Titles Queensland)",
  primaryCurrency: "AUD",
  timezone: "Australia/Sydney",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "Torrens Title search extraction, Deposited Plan analysis, and Section 32 vendor statement checks supported.",

  officialRegistries: [
    {
      name: "NSW Land Registry Services (LRS / Victoria Land Titles / Titles QLD)",
      description: "State land title registries maintaining the Torrens title register with government-backed title guarantee.",
      level: "STATE_PROVINCIAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "CERTIFICATE_OF_TITLE_AU",
      label: "Certificate of Title (Title Search)",
      description: "Electronic Torrens title search showing Folio Identifier, first schedule (owners), and second schedule (easements).",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "DEPOSITED_PLAN",
      label: "Deposited Plan (DP) / Strata Plan (SP)",
      description: "Registered cadastral survey plan establishing legal lot boundaries and easements.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
    {
      id: "VENDOR_STATEMENT",
      label: "Contract for Sale & Section 32 Statement",
      description: "Statutory disclosure document detailing outgoings, zoning, planning overlays, and building permits.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
  ],

  verificationChecklist: [
    {
      key: "torrens_title_folio_check",
      title: "Torrens Title Search & Folio Identifier Verification",
      description: "Verify current registered proprietors, encumbrances, and mortgages on the State Land Titles Register.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "deposited_plan_easement_check",
      title: "Deposited Plan (DP) & Easement Inspection",
      description: "Check boundaries, rights of carriageway, drainage easements, and covenants on the registered DP.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("certificate of title") || lower.includes("folio identifier") || lower.includes("land registry services")) {
      return {
        category: "CERTIFICATE_OF_TITLE_AU",
        categoryLabel: "Certificate of Title (Torrens)",
        confidence: 0.95,
        summary: "Australian Torrens Title Search with government title guarantee.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("deposited plan") || lower.includes("strata plan") || (lower.includes("lot") && lower.includes("dp"))) {
      return {
        category: "DEPOSITED_PLAN",
        categoryLabel: "Deposited Plan (DP)",
        confidence: 0.93,
        summary: "Registered Deposited / Strata survey plan.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting Australian real property document.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const folioMatch = text.match(/(?:folio\s+identifier|title\s+ref(?:erence)?)\s*[:.]?\s*([0-9A-Za-z\/-]+)/i);
    if (folioMatch) {
      fields.push({
        fieldName: "folio_identifier",
        fieldValue: folioMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.95,
        sourceSnippet: folioMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    return [];
  },
};
