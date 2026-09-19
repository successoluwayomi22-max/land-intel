import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const GhanaAdapter: JurisdictionAdapter = {
  countryCode: "GH",
  name: "Ghana",
  legalSystem: "Common Law / Customary Law (Stool & Skin lands)",
  landRegistrationSystem: "Lands Commission (Title Registration under Land Act 2020, Act 1036)",
  primaryCurrency: "GHS",
  timezone: "Africa/Accra",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "Document analysis, cadastral plan cross-checks, and Lands Commission search guidance supported.",

  officialRegistries: [
    {
      name: "Lands Commission of Ghana (Public and Vested Lands Management Division)",
      description: "Custodian of public land records, stool land concessions, and statutory leases.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Land Registration Division (Lands Commission)",
      description: "Issues official Land Title Certificates and maintains the land register.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Survey and Mapping Division (SMD)",
      description: "Approves cadastral plans, pillaring, and beacon coordinates.",
      level: "NATIONAL",
      isDigitalSearchAvailable: false,
    },
  ],

  commonDocuments: [
    {
      id: "LAND_TITLE_CERTIFICATE",
      label: "Land Title Certificate",
      description: "Official certificate of ownership issued by Land Registration Division conferring indefeasible title.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "INDENTURE",
      label: "Customary / Commercial Indenture",
      description: "Deed of lease or conveyance executed by Stool, Skin, family head, or private assignor.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "CADASTRAL_PLAN",
      label: "Approved Cadastral Plan",
      description: "Plan prepared by a licensed surveyor and certified by the Director of Surveys.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
    {
      id: "SEARCH_CERTIFICATE",
      label: "Official Lands Commission Search Certificate",
      description: "Official results from the Lands Commission confirming registered transactions and encumbrances.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "STOOL_CONSENT",
      label: "Stool / Skin Allocation & Consent",
      description: "Instrument evidencing grant from traditional stool authorities with concurrence under Land Act 2020.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
  ],

  verificationChecklist: [
    {
      key: "lands_commission_search",
      title: "Official Lands Commission Search",
      description: "Verify registered title or deed records at the Lands Commission (Records, Survey, and Land Registration Divisions).",
      requiresProfessional: true,
      category: "STATUTORY_TITLE",
    },
    {
      key: "stool_family_concurrence",
      title: "Stool Concurrence & Traditional Authority Validation",
      description: "Verify that grantor possessed authority to alienate stool land under Section 9 of the Land Act 2020.",
      requiresProfessional: true,
      category: "OWNERSHIP_LINEAGE",
    },
    {
      key: "cadastral_plan_smd_barcoding",
      title: "SMD Certified Cadastral Plan & Barcode Verification",
      description: "Confirm survey plan is barcoded and approved by the Survey and Mapping Division.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "ground_beacon_inspection",
      title: "On-Site Pillar Pickup & Ground Inspection",
      description: "Confirm concrete boundary pillars are in position and match the coordinates on the approved plan.",
      requiresProfessional: true,
      category: "PHYSICAL_INSPECTION",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("land title certificate") || lower.includes("certificate of title") || lower.includes("land registration division")) {
      return {
        category: "LAND_TITLE_CERTIFICATE",
        categoryLabel: "Land Title Certificate",
        confidence: 0.95,
        summary: "Official Ghana Land Title Certificate issued under Land Act 2020.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("cadastral plan") || lower.includes("survey and mapping division") || lower.includes("director of surveys")) {
      return {
        category: "CADASTRAL_PLAN",
        categoryLabel: "Approved Cadastral Plan",
        confidence: 0.93,
        summary: "Official Cadastral Plan showing beacon coordinates and SMD barcoding.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("indenture") || lower.includes("deed of lease") || lower.includes("stool land grant")) {
      return {
        category: "INDENTURE",
        categoryLabel: "Commercial or Customary Indenture",
        confidence: 0.91,
        summary: "Indenture transferring leasehold interest in Ghanaian land.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting land documentation in Ghana.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const titleMatch = text.match(/(?:certificate\s+no\.?|title\s+no\.?|volume\/folio)\s*[:.]?\s*([A-Za-z0-9\/-]+)/i);
    if (titleMatch) {
      fields.push({
        fieldName: "title_number",
        fieldValue: titleMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.93,
        sourceSnippet: titleMatch[0],
      });
    }

    const plotMatch = text.match(/plot\s+(?:no\.?|number)?\s*([A-Za-z0-9\/-]+)/i);
    if (plotMatch) {
      fields.push({
        fieldName: "plot_number",
        fieldValue: plotMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.91,
        sourceSnippet: plotMatch[0],
      });
    }

    const areaMatch = text.match(/([0-9,.]+)\s*(?:acres?|hectares?|sq\.?\s*m)/i);
    if (areaMatch) {
      fields.push({
        fieldName: "land_area",
        fieldValue: areaMatch[0].trim(),
        pageNumber: 1,
        confidence: 0.89,
        sourceSnippet: areaMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    const contradictions: ReconciledContradiction[] = [];
    const plotItems = documents.flatMap((d) =>
      d.extractions.filter((e) => e.fieldName === "plot_number").map((e) => ({ ...e, docName: d.originalName, docId: d.id }))
    );

    if (plotItems.length >= 2) {
      const canonical = plotItems[0].fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "");
      const mismatch = plotItems.find((p) => p.fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "") !== canonical);
      if (mismatch) {
        contradictions.push({
          field: "plot_number",
          title: "Plot Discrepancy Between Ghanaian Title Documents",
          severity: "HIGH",
          category: "CONSISTENCY",
          description: `Plot identification variance: "${plotItems[0].fieldValue}" in ${plotItems[0].docName} vs "${mismatch.fieldValue}" in ${mismatch.docName}.`,
          docAId: plotItems[0].docId,
          docAName: plotItems[0].docName,
          docAPage: plotItems[0].pageNumber,
          docAValue: plotItems[0].fieldValue,
          docBId: mismatch.docId,
          docBName: mismatch.docName,
          docBPage: mismatch.pageNumber,
          docBValue: mismatch.fieldValue,
          whyItMatters: "Discrepancies in Ghanaian plot numbers can cause double-registration at the Lands Commission.",
          recommendedAction: "Request formal clarification from the licensed surveyor and verify against the Lands Commission parcel plan.",
          isPremiumLocked: true,
        });
      }
    }

    return contradictions;
  },
};
