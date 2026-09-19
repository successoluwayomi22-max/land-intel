import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export function createFallbackAdapter(countryCode: string, countryName?: string): JurisdictionAdapter {
  return {
    countryCode: countryCode.toUpperCase(),
    name: countryName || `Jurisdiction (${countryCode.toUpperCase()})`,
    legalSystem: "Local Legal Framework",
    landRegistrationSystem: "National / Municipal Real Property Registry",
    primaryCurrency: "USD",
    timezone: "UTC",
    supportLevel: "LEVEL_1",
    supportLevelNotice:
      "Limited Support: Basic document storage, optical character recognition (OCR), and text extraction are supported for this jurisdiction. Automated cadastral registry cross-checks and authoritative title verification require local professional legal retention.",

    officialRegistries: [],

    commonDocuments: [
      {
        id: "TITLE_DEED_GENERAL",
        label: "Title Deed / Conveyance Instrument",
        description: "Official legal instrument conveying real property interest in the local jurisdiction.",
        isStatutoryTitle: true,
        requiresCadastralCheck: false,
      },
      {
        id: "SURVEY_MAP_GENERAL",
        label: "Cadastral Survey / Boundary Map",
        description: "Survey diagram indicating parcel boundaries and spatial coordinates.",
        isStatutoryTitle: false,
        requiresCadastralCheck: true,
      },
    ],

    verificationChecklist: [
      {
        key: "local_registry_search",
        title: "Local Title Registry Official Search",
        description: "Retain local licensed legal counsel to verify registered root of title and search for encumbrances.",
        requiresProfessional: true,
        category: "STATUTORY_TITLE",
      },
      {
        key: "physical_inspection",
        title: "Physical Boundary & Site Inspection",
        description: "Commission an on-ground physical inspection to verify boundaries and occupant claims.",
        requiresProfessional: true,
        category: "PHYSICAL_INSPECTION",
      },
    ],

    classifyDocument(text: string, filename: string): DocumentClassificationResult {
      const lower = (text + " " + filename).toLowerCase();

      if (lower.includes("survey") || lower.includes("plan") || lower.includes("cadastral") || lower.includes("map")) {
        return {
          category: "SURVEY_MAP_GENERAL",
          categoryLabel: "Boundary Survey Map",
          confidence: 0.80,
          summary: "General boundary or cadastral survey plan.",
          isRecognizedInJurisdiction: false,
        };
      }

      if (lower.includes("deed") || lower.includes("title") || lower.includes("contract") || lower.includes("transfer")) {
        return {
          category: "TITLE_DEED_GENERAL",
          categoryLabel: "Title / Conveyance Document",
          confidence: 0.80,
          summary: "General property title or conveyance deed.",
          isRecognizedInJurisdiction: false,
        };
      }

      return {
        category: "OTHER",
        categoryLabel: "Unclassified Document",
        confidence: 0.50,
        summary: "Supporting document under limited jurisdiction support.",
        isRecognizedInJurisdiction: false,
      };
    },

    extractEntities(text: string, category: string): ExtractedCadastralField[] {
      return [];
    },

    reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
      return [];
    },
  };
}
