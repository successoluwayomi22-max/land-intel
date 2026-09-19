import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const UKAdapter: JurisdictionAdapter = {
  countryCode: "GB",
  name: "United Kingdom (England & Wales)",
  legalSystem: "Common Law (Land Registration Act 2002)",
  landRegistrationSystem: "HM Land Registry (Digital Title Register & Title Plan)",
  primaryCurrency: "GBP",
  timezone: "Europe/London",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "HM Land Registry title extraction, Title Plan boundary checks, and TR1 conveyance reconciliation supported.",

  officialRegistries: [
    {
      name: "HM Land Registry (HMLR)",
      description: "Registers title to land and property across England and Wales with state-backed title guarantee.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Ordnance Survey (OS)",
      description: "National mapping agency providing the MasterMap digital parcel boundaries.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "OFFICIAL_COPY_REGISTER",
      label: "Official Copy of Register of Title",
      description: "Primary register document containing Property Register (A), Proprietorship Register (B), and Charges Register (C).",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "TITLE_PLAN",
      label: "HM Land Registry Title Plan",
      description: "Official map showing the general boundaries edged in red based on Ordnance Survey map data.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "TR1_TRANSFER",
      label: "TR1 Transfer Deed",
      description: "Standard statutory deed used to transfer registered property between buyer and seller.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "LOCAL_AUTHORITY_SEARCH",
      label: "Local Authority Search (LLC1 & CON29)",
      description: "Discloses planning history, conservation areas, listed building status, and tree preservation orders.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
  ],

  verificationChecklist: [
    {
      key: "hmlr_register_check",
      title: "HMLR Official Copy of Title Verification",
      description: "Confirm registered owner, absolute title grade, class of title, and all restrictive covenants or financial charges.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "general_boundary_inspection",
      title: "Title Plan General Boundary Check",
      description: "Verify red boundary edging against physical hedges, fences, and OS topography under Section 60 LRA 2002.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "charges_covenants_review",
      title: "Charges Register & Restrictive Covenants Analysis",
      description: "Analyze Schedule of Restrictive Covenants (e.g. building restrictions, rights of way, easements).",
      requiresProfessional: true,
      category: "STATUTORY_TITLE",
    },
    {
      key: "environmental_flood_search",
      title: "Environment Agency Flood Risk & Mining Search",
      description: "Check Environment Agency risk maps for surface water, river, and historic coal mining activity.",
      requiresProfessional: false,
      category: "PLANNING_ZONING",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("official copy of register of title") || lower.includes("land registry") || (lower.includes("title number") && lower.includes("proprietorship register"))) {
      return {
        category: "OFFICIAL_COPY_REGISTER",
        categoryLabel: "Official Copy of Register of Title",
        confidence: 0.96,
        summary: "HM Land Registry Official Copy of Title Register.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("title plan") || lower.includes("ordnance survey") || lower.includes("edged red")) {
      return {
        category: "TITLE_PLAN",
        categoryLabel: "HM Land Registry Title Plan",
        confidence: 0.94,
        summary: "HM Land Registry Title Plan based on Ordnance Survey map.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("tr1") || lower.includes("transfer of whole of registered title") || lower.includes("transferor") || lower.includes("transferee")) {
      return {
        category: "TR1_TRANSFER",
        categoryLabel: "TR1 Transfer Deed",
        confidence: 0.92,
        summary: "Statutory TR1 conveyance instrument.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting UK conveyancing document.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const titleMatch = text.match(/(?:title\s+number)\s*[:.]?\s*([A-Za-z0-9]+)/i);
    if (titleMatch) {
      fields.push({
        fieldName: "title_number",
        fieldValue: titleMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.95,
        sourceSnippet: titleMatch[0],
      });
    }

    const priceMatch = text.match(/(?:price\s+stated|consideration)\s*[:.]?\s*[£GBP]?\s*([0-9,.]+)/i);
    if (priceMatch) {
      fields.push({
        fieldName: "purchase_price",
        fieldValue: priceMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.91,
        sourceSnippet: priceMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    const contradictions: ReconciledContradiction[] = [];
    const titleItems = documents.flatMap((d) =>
      d.extractions.filter((e) => e.fieldName === "title_number").map((e) => ({ ...e, docName: d.originalName, docId: d.id }))
    );

    if (titleItems.length >= 2) {
      const canonical = titleItems[0].fieldValue.toUpperCase();
      const mismatch = titleItems.find((t) => t.fieldValue.toUpperCase() !== canonical);
      if (mismatch) {
        contradictions.push({
          field: "title_number",
          title: "HMLR Title Number Mismatch",
          severity: "CRITICAL",
          category: "CONSISTENCY",
          description: `Discrepancy: "${titleItems[0].fieldValue}" in ${titleItems[0].docName} vs "${mismatch.fieldValue}" in ${mismatch.docName}.`,
          docAId: titleItems[0].docId,
          docAName: titleItems[0].docName,
          docAPage: titleItems[0].pageNumber,
          docAValue: titleItems[0].fieldValue,
          docBId: mismatch.docId,
          docBName: mismatch.docName,
          docBPage: mismatch.pageNumber,
          docBValue: mismatch.fieldValue,
          whyItMatters: "Different Land Registry title numbers designate completely distinct parcels.",
          recommendedAction: "Confirm the correct Title Number from the current Official Copy before proceeding.",
          isPremiumLocked: true,
        });
      }
    }

    return contradictions;
  },
};
