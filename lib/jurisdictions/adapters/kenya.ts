import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const KenyaAdapter: JurisdictionAdapter = {
  countryCode: "KE",
  name: "Kenya",
  legalSystem: "Common Law (Constitution 2010, Land Act 2012, Land Registration Act 2012)",
  landRegistrationSystem: "Ministry of Lands & Physical Planning / ArdhiSasa Digital Land Registry",
  primaryCurrency: "KES",
  timezone: "Africa/Nairobi",
  supportLevel: "LEVEL_2",
  supportLevelNotice: "Digital title search guidance, ArdhiSasa verification workflow, and cadastral deed plan checks supported.",

  officialRegistries: [
    {
      name: "ArdhiSasa National Land Information Management System (NLIMS)",
      description: "Digital platform for search, transfer, and title validation under the Ministry of Lands.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Survey of Kenya (Ruaraka, Nairobi)",
      description: "Custodian of boundary survey records, Registry Index Maps (RIM), and deed plans.",
      level: "NATIONAL",
      isDigitalSearchAvailable: false,
    },
    {
      name: "National Land Commission (NLC)",
      description: "Manages public land and investigates historical land injustices.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "CERTIFICATE_OF_TITLE",
      label: "Certificate of Title / Lease",
      description: "Primary statutory title document issued under the Land Registration Act 2012.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "DEED_PLAN",
      label: "Approved Deed Plan",
      description: "Official geometric boundary diagram authenticated and signed by the Director of Surveys.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
    {
      id: "OFFICIAL_SEARCH_CERTIFICATE",
      label: "Official Search Certificate (CR 12 / Green Card / ArdhiSasa)",
      description: "Certified search results disclosing encumbrances, charges, caveats, or restrictions.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "MUTATION_FORM",
      label: "Cadastral Mutation Form",
      description: "Document signed by a licensed surveyor recording subdivision or boundary re-alignment.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
  ],

  verificationChecklist: [
    {
      key: "ardhisasa_digital_search",
      title: "ArdhiSasa Digital Registry Search",
      description: "Conduct official online search on ArdhiSasa to verify owner identity, charges, and pending caveats.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "deed_plan_rim_check",
      title: "Registry Index Map (RIM) & Deed Plan Verification",
      description: "Cross-reference survey deed plan against the Survey of Kenya Registry Index Map sheet.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "county_rates_clearance",
      title: "County Government Land Rates & Rent Clearance",
      description: "Verify that all outstanding ground rent and county land rates are fully discharged with valid certificates.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "physical_boundary_inspection",
      title: "Physical Boundary & Beacon Verification",
      description: "Locate boundary beacons with a registered surveyor and confirm no riparian reserve or road corridor encroachment.",
      requiresProfessional: true,
      category: "PHYSICAL_INSPECTION",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    if (lower.includes("certificate of title") || lower.includes("certificate of lease") || lower.includes("land registration act 2012")) {
      return {
        category: "CERTIFICATE_OF_TITLE",
        categoryLabel: "Certificate of Title",
        confidence: 0.95,
        summary: "Kenyan Certificate of Title/Lease under Land Registration Act 2012.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("deed plan") || lower.includes("director of surveys") || lower.includes("survey of kenya")) {
      return {
        category: "DEED_OF_PLAN",
        categoryLabel: "Approved Deed Plan",
        confidence: 0.93,
        summary: "Deed Plan certified by the Director of Surveys showing boundary beacons.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("official search") || lower.includes("ardhisasa") || lower.includes("green card")) {
      return {
        category: "OFFICIAL_SEARCH_CERTIFICATE",
        categoryLabel: "Official Search Certificate",
        confidence: 0.92,
        summary: "Ministry of Lands Official Search verifying encumbrances and ownership.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Document",
      confidence: 0.65,
      summary: "Supporting Kenyan property documentation.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    const titleMatch = text.match(/(?:title\s+no\.?|lr\s+no\.?|parcel\s+no\.?)\s*[:.]?\s*([A-Za-z0-9\/-]+)/i);
    if (titleMatch) {
      fields.push({
        fieldName: "title_number",
        fieldValue: titleMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.94,
        sourceSnippet: titleMatch[0],
      });
    }

    const areaMatch = text.match(/([0-9,.]+)\s*(?:ha|hectares?|acres?)/i);
    if (areaMatch) {
      fields.push({
        fieldName: "land_area",
        fieldValue: areaMatch[0].trim(),
        pageNumber: 1,
        confidence: 0.90,
        sourceSnippet: areaMatch[0],
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
      const canonical = titleItems[0].fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "");
      const mismatch = titleItems.find((p) => p.fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "") !== canonical);
      if (mismatch) {
        contradictions.push({
          field: "title_number",
          title: "Title / LR Number Inconsistency Across Kenyan Documents",
          severity: "HIGH",
          category: "CONSISTENCY",
          description: `Discrepancy detected: "${titleItems[0].fieldValue}" in ${titleItems[0].docName} vs "${mismatch.fieldValue}" in ${mismatch.docName}.`,
          docAId: titleItems[0].docId,
          docAName: titleItems[0].docName,
          docAPage: titleItems[0].pageNumber,
          docAValue: titleItems[0].fieldValue,
          docBId: mismatch.docId,
          docBName: mismatch.docName,
          docBPage: mismatch.pageNumber,
          docBValue: mismatch.fieldValue,
          whyItMatters: "Mismatched LR numbers can lead to purchasing an unintended plot or falling victim to dual titling.",
          recommendedAction: "Verify deed plan against the ArdhiSasa parcel index before entering contracts.",
          isPremiumLocked: true,
        });
      }
    }

    return contradictions;
  },
};
