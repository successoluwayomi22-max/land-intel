import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const SouthAfricaAdapter: JurisdictionAdapter = {
  countryCode: "ZA",
  name: "South Africa",
  legalSystem: "Roman-Dutch / Common Law (Deeds Registries Act 47 of 1937)",
  landRegistrationSystem: "Deeds Office (Deeds Registration System & Surveyor-General Diagrams)",
  primaryCurrency: "ZAR",
  timezone: "Africa/Johannesburg",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "Deeds Office Title Deed analysis, SG Diagram coordinate verification, and Sectional Title checks supported.",

  officialRegistries: [
    {
      name: "Deeds Office (Department of Agriculture, Land Reform and Rural Development)",
      description: "Registers title deeds, mortgage bonds, and notarial deeds across 11 regional offices.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Office of the Surveyor-General (SG)",
      description: "Approves and preserves all cadastral surveys, SG diagrams, and general plans.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "TITLE_DEED",
      label: "Deed of Transfer / Title Deed",
      description: "Official title deed registered by the Registrar of Deeds transferring ownership.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "SG_DIAGRAM",
      label: "Surveyor-General (SG) Diagram",
      description: "Authentic cadastral diagram showing property boundaries, beacons, co-ordinates, and servitudes.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
  ],

  verificationChecklist: [
    {
      key: "deeds_office_search",
      title: "DeedsWeb / Deeds Office Search",
      description: "Verify registered owner, purchase price, bondholder interdicts, and restrictive conditions.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "sg_diagram_verification",
      title: "Surveyor-General Diagram & Servitude Review",
      description: "Cross-reference SG diagram number against official SG database for servitudes and encroachments.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("deed of transfer") || lower.includes("registrar of deeds") || lower.includes("conveyancer")) {
      return {
        category: "TITLE_DEED",
        categoryLabel: "Deed of Transfer",
        confidence: 0.95,
        summary: "South African Deed of Transfer registered under Deeds Registries Act 1937.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("surveyor-general") || lower.includes("sg diagram") || lower.includes("erf")) {
      return {
        category: "SG_DIAGRAM",
        categoryLabel: "Surveyor-General Diagram",
        confidence: 0.94,
        summary: "Surveyor-General cadastral diagram showing Erf boundaries.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting South African property document.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const erfMatch = text.match(/(?:erf|portion)\s*([0-9]+(?:\s+of\s+[0-9]+)?)/i);
    if (erfMatch) {
      fields.push({
        fieldName: "erf_number",
        fieldValue: erfMatch[0].trim(),
        pageNumber: 1,
        confidence: 0.93,
        sourceSnippet: erfMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    return [];
  },
};
