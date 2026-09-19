import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const USAdapter: JurisdictionAdapter = {
  countryCode: "US",
  name: "United States",
  legalSystem: "Common Law / State Statutory Law",
  landRegistrationSystem: "County Recorder / Clerk of Deeds & Title Insurance System",
  primaryCurrency: "USD",
  timezone: "America/New_York",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "County deed classification, APN extraction, Title Commitment review, and plat map cross-checks supported.",

  officialRegistries: [
    {
      name: "County Clerk & Recorder's Office",
      description: "Maintains official deed books, mortgages, liens, and plat maps per county jurisdiction.",
      level: "COUNTY_MUNICIPAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "County Assessor / GIS Property Portal",
      description: "Maintains Assessor's Parcel Numbers (APN), tax appraisals, and GIS spatial boundary maps.",
      level: "COUNTY_MUNICIPAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "WARRANTY_DEED",
      label: "General / Special Warranty Deed",
      description: "Conveys fee simple title with covenants guaranteeing unencumbered title.",
      isStatutoryTitle: true,
      requiresCadastralCheck: false,
    },
    {
      id: "QUITCLAIM_DEED",
      label: "Quitclaim Deed",
      description: "Transfers only grantor's current interest without covenants or warranties of title.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "TITLE_COMMITMENT",
      label: "Preliminary Title Report / Title Commitment",
      description: "Title company commitment disclosing Schedule A (vesting) and Schedule B (exceptions & liens).",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "PLAT_MAP",
      label: "Recorded Subdivision Plat Map",
      description: "Official survey plat recorded with the county showing lot dimensions, setbacks, and easements.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
  ],

  verificationChecklist: [
    {
      key: "title_insurance_commitment",
      title: "Title Insurance Policy / Commitment Verification",
      description: "Review Schedule B exceptions to verify no unpermitted utility easements or mechanic's liens.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "county_recorder_chain",
      title: "County Recorder 40-Year Chain of Title Search",
      description: "Verify unbroken grantor-grantee chain and check for unreleased deeds of trust or tax liens.",
      requiresProfessional: true,
      category: "OWNERSHIP_LINEAGE",
    },
    {
      key: "alta_nsps_survey",
      title: "ALTA / NSPS Land Title Survey Inspection",
      description: "Confirm physical improvements, fences, and utility lines are within legal boundary lines.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "zoning_flood_fema",
      title: "FEMA Flood Zone & Municipal Zoning Verification",
      description: "Confirm property flood hazard designation (Zone X, AE, etc.) and municipal zoning compliance.",
      requiresProfessional: false,
      category: "PLANNING_ZONING",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("warranty deed") || lower.includes("conveys and warrants")) {
      return {
        category: "WARRANTY_DEED",
        categoryLabel: "Warranty Deed",
        confidence: 0.95,
        summary: "US Warranty Deed conveying fee simple real property interest.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("title commitment") || lower.includes("preliminary title report") || lower.includes("schedule a") && lower.includes("schedule b")) {
      return {
        category: "TITLE_COMMITMENT",
        categoryLabel: "Title Commitment Report",
        confidence: 0.94,
        summary: "Title insurance company preliminary commitment report.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("plat map") || lower.includes("subdivision plat") || lower.includes("lot") && lower.includes("block") && lower.includes("book") && lower.includes("page")) {
      return {
        category: "PLAT_MAP",
        categoryLabel: "Recorded Plat Map",
        confidence: 0.92,
        summary: "Recorded subdivision survey plat map.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting US real property document.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const apnMatch = text.match(/(?:apn|parcel\s+id|tax\s+id|account\s+no\.?)\s*[:.]?\s*([0-9\/-]+)/i);
    if (apnMatch) {
      fields.push({
        fieldName: "parcel_number",
        fieldValue: apnMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.94,
        sourceSnippet: apnMatch[0],
      });
    }

    const lotMatch = text.match(/lot\s+([0-9A-Za-z]+)[,\s]+block\s+([0-9A-Za-z]+)/i);
    if (lotMatch) {
      fields.push({
        fieldName: "lot_block",
        fieldValue: `Lot ${lotMatch[1]}, Block ${lotMatch[2]}`,
        pageNumber: 1,
        confidence: 0.92,
        sourceSnippet: lotMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    const contradictions: ReconciledContradiction[] = [];
    const parcelItems = documents.flatMap((d) =>
      d.extractions.filter((e) => e.fieldName === "parcel_number").map((e) => ({ ...e, docName: d.originalName, docId: d.id }))
    );

    if (parcelItems.length >= 2) {
      const canonical = parcelItems[0].fieldValue.replace(/[^0-9]/g, "");
      const mismatch = parcelItems.find((p) => p.fieldValue.replace(/[^0-9]/g, "") !== canonical);
      if (mismatch) {
        contradictions.push({
          field: "parcel_number",
          title: "Assessor Parcel Number (APN) Mismatch",
          severity: "HIGH",
          category: "CONSISTENCY",
          description: `APN variance: "${parcelItems[0].fieldValue}" in ${parcelItems[0].docName} vs "${mismatch.fieldValue}" in ${mismatch.docName}.`,
          docAId: parcelItems[0].docId,
          docAName: parcelItems[0].docName,
          docAPage: parcelItems[0].pageNumber,
          docAValue: parcelItems[0].fieldValue,
          docBId: mismatch.docId,
          docBName: mismatch.docName,
          docBPage: mismatch.pageNumber,
          docBValue: mismatch.fieldValue,
          whyItMatters: "Different APN numbers point to different tax parcels at the County Assessor's office.",
          recommendedAction: "Verify the legal description on the deed against the recorded county subdivision plat.",
          isPremiumLocked: true,
        });
      }
    }

    return contradictions;
  },
};
