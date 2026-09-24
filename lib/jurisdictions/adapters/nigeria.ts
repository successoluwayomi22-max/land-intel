import {
  JurisdictionAdapter,
  DocumentClassificationResult,
  ExtractedCadastralField,
  ReconciledContradiction,
} from "../types";

export const NigeriaAdapter: JurisdictionAdapter = {
  countryCode: "NG",
  name: "Nigeria",
  legalSystem: "Common Law / Customary / Islamic (Sharia in northern states)",
  landRegistrationSystem: "State Lands Registries under the Land Use Act 1978 (Statutory Right of Occupancy & Governor's Consent)",
  primaryCurrency: "NGN",
  timezone: "Africa/Lagos",
  supportLevel: "LEVEL_3",
  supportLevelNotice: "Full automated document analysis, cadastral beacon verification, and state registry verification workflow supported.",

  officialRegistries: [
    {
      name: "Lands Bureau, Alausa (Lagos State)",
      description: "Custodian of Lagos land records, Certificates of Occupancy, and Governor's Consent endorsements.",
      level: "STATE_PROVINCIAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Abuja Geographic Information Systems (AGIS / FCDA)",
      description: "Computerized cadastral database for the Federal Capital Territory.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
    {
      name: "Office of the State Surveyor General",
      description: "Official charting of cadastral coordinates against committed government acquisitions.",
      level: "STATE_PROVINCIAL",
      isDigitalSearchAvailable: false,
    },
    {
      name: "Surveyors Council of Nigeria (SURCON)",
      description: "National regulatory body registering certified practicing surveyors and beacon allocations.",
      level: "NATIONAL",
      isDigitalSearchAvailable: true,
    },
  ],

  commonDocuments: [
    {
      id: "SURVEY_PLAN",
      label: "Registered Survey Plan",
      description: "Cadastral survey displaying boundary beacons, coordinates, and registered surveyor seal.",
      isStatutoryTitle: false,
      requiresCadastralCheck: true,
    },
    {
      id: "CERTIFICATE_OF_OCCUPANCY",
      label: "Certificate of Occupancy (C of O)",
      description: "State-issued instrument conferring 99-year statutory leasehold interest under the Land Use Act 1978.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "GOVERNORS_CONSENT",
      label: "Governor's Consent",
      description: "Statutory gubernatorial consent required under Section 22 for any subsequent transfer of titled land.",
      isStatutoryTitle: true,
      requiresCadastralCheck: false,
    },
    {
      id: "DEED_OF_ASSIGNMENT",
      label: "Deed of Assignment",
      description: "Contractual deed transferring unexpired residue of land interest from assignor to assignee.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "GAZETTE",
      label: "Government Gazette (Excision)",
      description: "Official government publication documenting approved excision of customary/community land from acquisition.",
      isStatutoryTitle: true,
      requiresCadastralCheck: true,
    },
    {
      id: "ALLOCATION_LETTER",
      label: "Letter of Allocation",
      description: "Formal letter from state housing authority or accredited scheme allocating a specific plot.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "CONTRACT_OF_SALE",
      label: "Contract of Sale",
      description: "Agreement documenting consideration, payment milestones, and conditions precedent.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
    {
      id: "PURCHASE_RECEIPT",
      label: "Purchase Receipt",
      description: "Financial receipt from customary land-owning family or vendor acknowledging payment.",
      isStatutoryTitle: false,
      requiresCadastralCheck: false,
    },
  ],

  verificationChecklist: [
    {
      key: "location_reviewed",
      title: "Property Geographic Location Reviewed",
      description: "State, LGA, layout, and landmarks verified across all submitted documents.",
      requiresProfessional: false,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "plot_number_consistent",
      title: "Plot & Beacon Identifiers Reconciled",
      description: "Plot numbers, layout references, and survey pillar IDs match between deed and survey.",
      requiresProfessional: false,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "property_area_consistent",
      title: "Land Dimensions & Area Reconciled",
      description: "Square meters or hectares match across contract, deed, and survey plan.",
      requiresProfessional: false,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "seller_owner_reviewed",
      title: "Root of Title & Seller Lineage Reviewed",
      description: "Current vendor's name traces without break to original registered grantee or excised family.",
      requiresProfessional: false,
      category: "OWNERSHIP_LINEAGE",
    },
    {
      key: "survey_reviewed",
      title: "SURCON Registered Surveyor Certification",
      description: "Surveyor's registration number verified against SURCON register and charting records.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "title_documentation_reviewed",
      title: "Lands Bureau Title Registry Search",
      description: "Search conducted at State Lands Bureau (e.g. Alausa, AGIS) to verify root and encumbrances.",
      requiresProfessional: true,
      category: "STATUTORY_TITLE",
    },
    {
      key: "coordinates_reviewed",
      title: "Ground Beacon Verification (GPS Pickup)",
      description: "Physical boundary pillars located on ground to ensure no encroachment or shifted markers.",
      requiresProfessional: true,
      category: "CADASTRAL_BOUNDARY",
    },
    {
      key: "document_inconsistencies_reviewed",
      title: "Discrepancy Rectification",
      description: "All typographical, naming, or date variances addressed by vendor via statutory declaration.",
      requiresProfessional: false,
      category: "STATUTORY_TITLE",
    },
    {
      key: "legal_review",
      title: "Independent Property Legal Due Diligence",
      description: "Retain independent property solicitor to scrutinize covenants, easements, and execution.",
      requiresProfessional: true,
      category: "STATUTORY_TITLE",
    },
    {
      key: "physical_site_inspection",
      title: "Physical Inspection & Community Inquiries",
      description: "On-site visit confirming no trespass, boundary disputes, or rival traditional family claims.",
      requiresProfessional: true,
      category: "PHYSICAL_INSPECTION",
    },
    {
      key: "official_government_verification",
      title: "Cadastral Charting at Surveyor General's Office",
      description: "Formal charting confirming parcel is completely clear of committed state acquisition or road corridors.",
      requiresProfessional: true,
      category: "PLANNING_ZONING",
    },
  ],

  classifyDocument(text: string, filename: string): DocumentClassificationResult {
    const lower = (text + " " + filename).toLowerCase();

    // Check for irrelevant images, screenshots, or explicit non-cadastral verdicts
    if (
      lower.includes("[non_cadastral") ||
      lower.includes("katana") ||
      lower.includes("facebook") ||
      lower.includes("screenshot") ||
      lower.includes("instagram") ||
      lower.includes("tiktok") ||
      lower.includes("whatsapp") ||
      lower.includes("[unverified_image")
    ) {
      return {
        category: "OTHER",
        categoryLabel: "Non-Cadastral / Unverified File",
        confidence: 0.99,
        summary: "Non-cadastral or irrelevant image file. Lacks certified surveyor seals, coordinates, or statutory land title records.",
        isRecognizedInJurisdiction: false,
      };
    }

    if (lower.includes("survey plan") || lower.includes("beacon") || lower.includes("cadastral") || lower.includes("surveyor general") || lower.includes("boundary pillars")) {
      return {
        category: "SURVEY_PLAN",
        categoryLabel: "Cadastral Survey Plan",
        confidence: 0.95,
        summary: "Cadastral Survey Plan displaying boundary beacons, coordinates, and registered surveyor certification.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("deed of assignment") || lower.includes("assignor") || lower.includes("assignee") || lower.includes("transfer of interest") || lower.includes("conveyance")) {
      return {
        category: "DEED_OF_ASSIGNMENT",
        categoryLabel: "Deed of Assignment",
        confidence: 0.92,
        summary: "Deed of Assignment transferring legal interest, rights, and title in the described parcel.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("certificate of occupancy") || lower.includes("c of o") || lower.includes("land use act 1978") || lower.includes("certificate of title")) {
      return {
        category: "CERTIFICATE_OF_OCCUPANCY",
        categoryLabel: "Certificate of Occupancy (C of O)",
        confidence: 0.96,
        summary: "State Government Certificate of Occupancy granting statutory right of occupancy.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("governor's consent") || lower.includes("governors consent") || lower.includes("approval to assign") || lower.includes("honourable commissioner")) {
      return {
        category: "GOVERNORS_CONSENT",
        categoryLabel: "Governor's Consent",
        confidence: 0.94,
        summary: "Official Governor's Consent endorsing subsequent transaction over titled land.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("gazette") || lower.includes("official gazette") || lower.includes("excision notice") || lower.includes("notice of revocation")) {
      return {
        category: "GAZETTE",
        categoryLabel: "Government Gazette",
        confidence: 0.91,
        summary: "Official Government Gazette publication detailing excision or legal land status.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("allocation letter") || lower.includes("letter of allocation") || lower.includes("provisional allocation")) {
      return {
        category: "ALLOCATION_LETTER",
        categoryLabel: "Allocation Letter",
        confidence: 0.90,
        summary: "Formal allocation letter from public authority or accredited scheme developer.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("contract of sale") || lower.includes("sales agreement") || lower.includes("memorandum of agreement")) {
      return {
        category: "CONTRACT_OF_SALE",
        categoryLabel: "Contract of Sale",
        confidence: 0.88,
        summary: "Contract of Sale specifying consideration amount, payment tranches, and delivery terms.",
        isRecognizedInJurisdiction: true,
      };
    }

    if (lower.includes("receipt") || lower.includes("acknowledgment of payment") || lower.includes("family receipt")) {
      return {
        category: "PURCHASE_RECEIPT",
        categoryLabel: "Purchase Receipt",
        confidence: 0.85,
        summary: "Financial purchase receipt documenting consideration payment.",
        isRecognizedInJurisdiction: true,
      };
    }

    return {
      category: "OTHER",
      categoryLabel: "Supporting Documentation",
      confidence: 0.65,
      summary: "Supporting land or identification document.",
      isRecognizedInJurisdiction: false,
    };
  },

  extractEntities(text: string, category: string): ExtractedCadastralField[] {
    const fields: ExtractedCadastralField[] = [];

    // Plot number extraction
    const plotMatch = text.match(/plot\s+(?:no\.?|number)?\s*([A-Za-z0-9\/-]+)/i);
    if (plotMatch) {
      fields.push({
        fieldName: "plot_number",
        fieldValue: plotMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.92,
        sourceSnippet: plotMatch[0],
      });
    }

    // Survey plan number
    const surveyNoMatch = text.match(/(?:survey\s*plan\s*no\.?|plan\s*no\.?)\s*([A-Za-z0-9\/-]+)/i);
    if (surveyNoMatch) {
      fields.push({
        fieldName: "survey_number",
        fieldValue: surveyNoMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.94,
        sourceSnippet: surveyNoMatch[0],
      });
    }

    // Land Area (sqm or hectares)
    const areaMatch = text.match(/([0-9,.]+)\s*(?:sq\.?\s*m(?:eters?)?|sqm|hectares?|acres?)/i);
    if (areaMatch) {
      fields.push({
        fieldName: "land_area",
        fieldValue: areaMatch[0].trim(),
        pageNumber: 1,
        confidence: 0.90,
        sourceSnippet: areaMatch[0],
      });
    }

    // Assignor / Vendor
    const assignorMatch = text.match(/(?:assignor|vendor|seller|grantor)\s*:\s*([A-Za-z\s.]+)(?:\n|,|;)/i);
    if (assignorMatch) {
      fields.push({
        fieldName: "seller_name",
        fieldValue: assignorMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.88,
        sourceSnippet: assignorMatch[0],
      });
    }

    // Assignee / Purchaser
    const assigneeMatch = text.match(/(?:assignee|purchaser|buyer|grantee)\s*:\s*([A-Za-z\s.]+)(?:\n|,|;)/i);
    if (assigneeMatch) {
      fields.push({
        fieldName: "buyer_name",
        fieldValue: assigneeMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.88,
        sourceSnippet: assigneeMatch[0],
      });
    }

    // Surveyor Name
    const surveyorMatch = text.match(/(?:surveyor|surveyed\s+by)\s*:\s*([A-Za-z\s.]+)/i);
    if (surveyorMatch) {
      fields.push({
        fieldName: "surveyor_name",
        fieldValue: surveyorMatch[1].trim(),
        pageNumber: 1,
        confidence: 0.91,
        sourceSnippet: surveyorMatch[0],
      });
    }

    return fields;
  },

  reconcileDocuments(caseContext, documents): ReconciledContradiction[] {
    const contradictions: ReconciledContradiction[] = [];

    // Group extractions by field
    const plotItems = documents.flatMap((d) =>
      d.extractions.filter((e) => e.fieldName === "plot_number").map((e) => ({ ...e, docName: d.originalName, docId: d.id, category: d.category }))
    );

    if (plotItems.length >= 2) {
      const canonical = plotItems[0].fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "");
      const mismatch = plotItems.find((p) => p.fieldValue.toLowerCase().replace(/[^a-z0-9]/g, "") !== canonical);

      if (mismatch) {
        contradictions.push({
          field: "plot_number",
          title: "Plot Reference Inconsistency Between Submitted Documents",
          severity: "HIGH",
          category: "CONSISTENCY",
          description: `Different plot references detected across documents: "${plotItems[0].fieldValue}" in ${plotItems[0].docName} vs "${mismatch.fieldValue}" in ${mismatch.docName}.`,
          docAId: plotItems[0].docId,
          docAName: plotItems[0].docName,
          docAPage: plotItems[0].pageNumber,
          docAValue: plotItems[0].fieldValue,
          docBId: mismatch.docId,
          docBName: mismatch.docName,
          docBPage: mismatch.pageNumber,
          docBValue: mismatch.fieldValue,
          whyItMatters: "Different plot references indicate that the Survey Plan and Deed of Assignment may be referencing two distinct property parcels or an uncorrected clerical transfer error.",
          recommendedAction: "Request that the vendor and licensed surveyor immediately clarify the cadastral beacon references against the original approved layout plan before releasing funds.",
          isPremiumLocked: true,
        });
      }
    }

    return contradictions;
  },
};
